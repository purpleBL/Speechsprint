let isSpeechEnabled = true;

let words = {
  nouns: [],
  adjectives: [],
  verbs: []
};

// Кэш для хранения данных
let wordsCache = {
  nouns: [],
  adjectives: [],
  verbs: []
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

// Обработчик события touchstart для инициализации аудио
document.addEventListener('touchstart', function initAudio() {
  silentAudios.forEach(audio => {
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
    }).catch(console.warn);
  });
  document.removeEventListener('touchstart', initAudio);
}, { once: true });

// Обработчик события visibilitychange для управления аудио
document.addEventListener('visibilitychange', function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    keepAudioAlive = true;
    playNextSilentAudio();
  } else {
    keepAudioAlive = false;
    silentAudios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }
});

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

  // Делаем кнопку "Старт" неактивной до загрузки файла с данными
  const startBtn = document.getElementById("startBtn");
  startBtn.disabled = true;
  startBtn.style.opacity = "0.5";
  startBtn.style.cursor = "not-allowed";
  startBtn.style.backgroundColor = "#99DBFF"; // Устанавливаем начальный цвет кнопки
  startBtn.style.color = "#21252B"; // Устанавливаем начальный цвет текста кнопки
});

function getRandomWord() {
  progress = 100;
  updateProgressBar();
  const selectedCategory = document.getElementById("wordCategory").value;
  let randomType, randomWord, availableWords;

  if (selectedCategory === "all") {
    const nonEmptyTypes = Object.keys(wordsCache).filter(
      (type) => wordsCache[type].length > 0
    );
    if (nonEmptyTypes.length === 0) return;
    randomType = nonEmptyTypes[Math.floor(Math.random() * nonEmptyTypes.length)];
    availableWords = wordsCache[randomType];
  } else {
    randomType = selectedCategory;
    availableWords = wordsCache[selectedCategory];
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

  try {
    document.getElementById("currentWord").textContent = randomWord;
    document.getElementById("wordType").textContent = {
      nouns: "существительное",
      verbs: "глагол",
      adjectives: "прилагательное"
    }[randomType] || "неизвестно";
  } catch (error) {
    console.error("Ошибка при выводе слова и категории:", error);
    console.error("randomWord:", randomWord);
    console.error("randomType:", randomType);
  }

  if (isSpeechEnabled) {
    const utterance = new SpeechSynthesisUtterance(randomWord);
    utterance.lang = "ru-RU";
    speechSynthesis.speak(utterance);
  }
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
  const totalWords = Object.values(wordsCache).reduce(
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
    startBtn.style.color = "#d6e2ee";

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
  }
}

document.getElementById("startBtn").addEventListener("click", toggleAppFunctions);

document.getElementById("speechToggle").addEventListener("change", (e) => {
  isSpeechEnabled = e.target.checked;
});

function updateWordCounts() {
  document.getElementById("totalWords").textContent = Object.values(
    wordsCache
  ).reduce((sum, arr) => sum + arr.length, 0);
  document.getElementById("nounsCount").textContent = wordsCache.nouns.length;
  document.getElementById("adjectivesCount").textContent =
    wordsCache.adjectives.length;
  document.getElementById("verbsCount").textContent = wordsCache.verbs.length;

  const select = document.getElementById("wordCategory");
  const options = select.options;

  for (let i = 0; i < options.length; i++) {
    const value = options[i].value;
    if (value === "all") {
      options[i].disabled = Object.values(wordsCache).every(
        (arr) => arr.length === 0
      );
    } else {
      options[i].disabled = wordsCache[value].length === 0;
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

// Функция для загрузки данных из файла и заполнения кэша
function loadWordsFromFile(file) {
  words.nouns = [];
  words.adjectives = [];
  words.verbs = [];
  wordsCache = {
    nouns: [],
    adjectives: [],
    verbs: []
  };

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
          wordsCache[currentCategory].push(line);
        }
      });

      updateWordCounts();
      updateStartButtonState();

      // Активируем кнопку "Старт" после загрузки данных
      const startBtn = document.getElementById("startBtn");
      startBtn.disabled = false;
      startBtn.style.opacity = "1";
      startBtn.style.cursor = "pointer";
      startBtn.style.backgroundColor = "#99DBFF"; // Устанавливаем начальный цвет кнопки
      startBtn.style.color = "#21252B"; // Устанавливаем начальный цвет текста кнопки
    };
    reader.readAsText(file);
  }
}

document.getElementById("wordFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  loadWordsFromFile(file);
  document.getElementById("currentWord").textContent = "Нажмите старт";
});

// Функция для очистки данных
function clearCustomData() {
  words.nouns = [];
  words.adjectives = [];
  words.verbs = [];
  wordsCache = {
    nouns: [],
    adjectives: [],
    verbs: []
  };
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

  // Сбрасываем стиль кнопки "Старт"
  const startBtn = document.getElementById("startBtn");
  startBtn.textContent = "Старт";
  startBtn.style.backgroundColor = "#99DBFF"; // Возвращаем начальный цвет кнопки
  startBtn.style.color = "#21252B"; // Возвращаем начальный цвет текста кнопки
}

document.getElementById("clearCustomBtn").addEventListener("click", clearCustomData);

document.getElementById("currentWord").textContent =
  "Загрузите базу и нажмите старт";

updateWordCounts();
