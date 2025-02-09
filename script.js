let isSpeechEnabled = true;

const words = {
  nouns: [],
  adjectives: [],
  verbs: [],
};

let timer = null;
let progressTimer = null;
let progress = 100;
let recentWords = [];

// Создаем несколько копий аудио для чередования
const silentAudios = [
    new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"),
    new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"),
    new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA")
];

let currentAudioIndex = 0;
let keepAudioAlive = false;

// Функция для циклического воспроизведения тишины
function playNextSilentAudio() {
    if (!keepAudioAlive) return;
    
    const audio = silentAudios[currentAudioIndex];
    audio.play()
        .then(() => {
            currentAudioIndex = (currentAudioIndex + 1) % silentAudios.length;
            // Планируем следующее воспроизведение перед окончанием текущего
            setTimeout(playNextSilentAudio, 100);
        })
        .catch(error => {
            console.warn('Silent audio playback failed:', error);
            // Пробуем снова через короткий промежуток
            setTimeout(playNextSilentAudio, 1000);
        });
}

document.addEventListener('touchstart', function initAudio() {
    silentAudios.forEach(audio => {
        audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
        }).catch(console.warn);
    });
    document.removeEventListener('touchstart', initAudio);
}, { once: true });

document.addEventListener("DOMContentLoaded", function () {
  var inputFile = document.querySelector(".main_input_file");
  var outputField = document.getElementById("f_name");

  inputFile.addEventListener("change", function () {
    var f_name = [];
    var files = inputFile.files;

    for (var i = 0; i < files.length; i++) {
      f_name.push(files[i].name);
    }

    outputField.value = f_name.join(", ");
  });
});

function getRandomWord() {
  progress = 100;
  updateProgressBar();
  const selectedCategory = document.getElementById("wordCategory").value;
  let randomType, randomWord, availableWords;

  if (selectedCategory === "all") {
    const nonEmptyTypes = Object.keys(words).filter(
      (type) => words[type].length > 0
    );
    if (nonEmptyTypes.length === 0) return;
    randomType =
      nonEmptyTypes[Math.floor(Math.random() * nonEmptyTypes.length)];
    availableWords = Object.values(words).flat();
  } else {
    if (words[selectedCategory].length === 0) return;
    randomType = selectedCategory;
    availableWords = words[selectedCategory];
  }

  const totalWords = availableWords.length;
  let minDistance;

  if (totalWords >= 50) {
    minDistance = 25;
  } else if (totalWords >= 10) {
    minDistance = 10;
  } else if (totalWords >= 2) {
    minDistance = 1;
  } else {
    minDistance = 0;
  }

  const validWords = availableWords.filter((word) => {
    const lastIndex = recentWords.lastIndexOf(word);
    return lastIndex === -1 || recentWords.length - lastIndex > minDistance;
  });

  if (validWords.length === 0) {
    recentWords = [];
    randomWord =
      availableWords[Math.floor(Math.random() * availableWords.length)];
  } else {
    randomWord = validWords[Math.floor(Math.random() * validWords.length)];
  }

  recentWords.push(randomWord);
  if (recentWords.length > 50) {
    recentWords.shift();
  }

  document.getElementById("currentWord").textContent = randomWord;

  if (isSpeechEnabled) {
    const utterance = new SpeechSynthesisUtterance(randomWord);
    utterance.lang = "ru-RU";
    speechSynthesis.speak(utterance);
  }

  document.getElementById("wordType").textContent = {
    nouns: "существительное",
    adjectives: "прилагательное",
    verbs: "глагол",
  }[randomType];
}
function updateProgressBar() {
  const circle = document.querySelector(".progress-ring-circle");
  const radius = circle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = offset;
  const seconds = Math.ceil(
    (progress / 100) * document.getElementById("interval").value
  );
  document.getElementById("timeLeft").textContent = seconds;
}

function isBankEmpty() {
  const totalWords = Object.values(words).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  return totalWords === 0;
}

function updateStartButtonState() {
  const startBtn = document.getElementById("startBtn");
  const isDisabled = isBankEmpty();
  startBtn.disabled = isDisabled;
  startBtn.style.opacity = isDisabled ? "0.5" : "1";
  startBtn.style.cursor = isDisabled ? "not-allowed" : "pointer";
}

function toggleAppFunctions() {
    const startBtn = document.getElementById("startBtn");

    if (timer) {
        // Остановка
        clearInterval(progressTimer);
        clearInterval(timer);
        timer = null;
        progress = 100;
        updateProgressBar();
        document.getElementById("currentWord").textContent = "Нажмите старт";
        document.getElementById("wordType").textContent = "";
        startBtn.textContent = "СТАРТ";
        startBtn.style.backgroundColor = "#99DBFF";
        startBtn.style.color = "#21252B";

        // Останавливаем циклическое воспроизведение
        keepAudioAlive = false;
        silentAudios.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });

    } else {
        // Старт
        if (isBankEmpty()) return;
        startBtn.style.backgroundColor = "#CC422D";

        // Запускаем циклическое воспроизведение
        keepAudioAlive = true;
        playNextSilentAudio();

        const interval = document.getElementById("interval").value;
        getRandomWord();
        timer = setInterval(getRandomWord, interval * 1000);

        const step = 100 / (interval * 10);
        progressTimer = setInterval(() => {
            progress = Math.max(0, progress - step);
            updateProgressBar();
        }, 100);
        startBtn.textContent = "СТОП";
        startBtn.style.color = "#d6e2ee";
    }
}

document.getElementById("startBtn").addEventListener("click", toggleAppFunctions);

document.getElementById("speechToggle").addEventListener("change", (e) => {
  isSpeechEnabled = e.target.checked;
});

function updateWordCounts() {
  document.getElementById("totalWords").textContent = Object.values(
    words
  ).reduce((sum, arr) => sum + arr.length, 0);
  document.getElementById("nounsCount").textContent = words.nouns.length;
  document.getElementById("adjectivesCount").textContent =
    words.adjectives.length;
  document.getElementById("verbsCount").textContent = words.verbs.length;

  const select = document.getElementById("wordCategory");
  const options = select.options;

  for (let i = 0; i < options.length; i++) {
    const value = options[i].value;
    if (value === "all") {
      options[i].disabled = Object.values(words).every(
        (arr) => arr.length === 0
      );
    } else {
      options[i].disabled = words[value].length === 0;
    }
  }

  if (select.selectedOptions[0].disabled) {
    for (let option of options) {
      if (!option.disabled) {
        select.value = option.value;
        break;
      }
    }
  }
}

document.getElementById("wordFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  words.nouns = [];
  words.adjectives = [];
  words.verbs = [];

  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content.split("\n").map((line) => line.trim());

      let currentCategory = "";
      lines.forEach((line) => {
        if (line === "nouns-data") {
          currentCategory = "nouns";
        } else if (line === "verbs-data") {
          currentCategory = "verbs";
        } else if (line === "adjectives-data") {
          currentCategory = "adjectives";
        } else if (line && currentCategory) {
          words[currentCategory].push(line);
        }
      });

      updateWordCounts();
      updateStartButtonState();
    };
    reader.readAsText(file);
  }
});

updateStartButtonState();

document.getElementById("clearCustomBtn").addEventListener("click", () => {
  words.nouns = [];
  words.adjectives = [];
  words.verbs = [];
  updateWordCounts();
  const fileInput = document.getElementById("wordFile");
  fileInput.value = "";
  document.getElementById("currentWord").textContent =
    "Загрузите базу и нажмите старт";
  document.getElementById("wordType").textContent = "";
  updateStartButtonState();
  if (timer) {
    clearInterval(timer);
    clearInterval(progressTimer);
    timer = null;
    progress = 100;
    updateProgressBar();
  }
  document.getElementById("f_name").value = "Файл не выбран.";
});

document.getElementById("currentWord").textContent =
  "Загрузите базу и нажмите старт";

document.getElementById("wordFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    document.getElementById("currentWord").textContent = "Нажмите старт";
  }
});

updateWordCounts();

document.getElementById("clearCustomBtn").addEventListener("click", () => {
  const startBtn = document.getElementById("startBtn");
  startBtn.textContent = "Старт";
});