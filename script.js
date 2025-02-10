let isSpeechEnabled = true;

let words = {
  nouns: [],
  adjectives: [],
  verbs: []
};

let wordsCache = {
  nouns: [],
  adjectives: [],
  verbs: []
};

let timer = null;
let progressTimer = null;
let progress = 100;
let recentWords = [];

const silentAudios = [
  new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"),
  new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"),
  new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA")
];

let currentAudioIndex = 0;
let keepAudioAlive = false;

function playNextSilentAudio() {
  if (!keepAudioAlive) return;

  const audio = silentAudios[currentAudioIndex];
  audio.play()
    .then(() => {
      currentAudioIndex = (currentAudioIndex + 1) % silentAudios.length;
      setTimeout(playNextSilentAudio, 100);
    })
    .catch(error => {
      console.warn('Silent audio playback failed:', error);
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

    if (files.length === 0) {
      outputField.value = "Файл не выбран.";
      saveFileName("Файл не выбран.");
    } else {
      for (var i = 0; i < files.length; i++) {
        f_name.push(files[i].name);
      }
      outputField.value = f_name.join(", ");
      saveFileName(f_name.join(", "));
    }
  });

  const startBtn = document.getElementById("startBtn");
  startBtn.disabled = true;
  startBtn.style.opacity = "0.5";
  startBtn.style.cursor = "not-allowed";
  startBtn.style.backgroundColor = "#99DBFF";
  startBtn.style.color = "#21252B";

  // Загружаем данные из localStorage при загрузке страницы
  loadWordsFromStorage();
  loadFileNameFromStorage();

  // Проверяем, есть ли данные в localStorage
  if (Object.values(wordsCache).some(arr => arr.length > 0)) {
    document.getElementById("currentWord").textContent = "Нажмите старт";
  } else {
    document.getElementById("currentWord").textContent = "Загрузите базу и нажмите старт";
  }
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

  if (totalWords >= 100) {
    minDistance = 50;
  } else if (totalWords >= 50) {
    minDistance = 30;
  } else if (totalWords >= 30) {
    minDistance = 15;
  } else if (totalWords >= 10) {
    minDistance = 5;
  } else if (totalWords >= 5) {
    minDistance = 3;
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

  if (isDisabled) {
    startBtn.style.backgroundColor = "#99DBFF";
    startBtn.style.color = "#21252B";
  }
}

function toggleAppFunctions() {
  const startBtn = document.getElementById("startBtn");

  if (timer) {
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

    keepAudioAlive = false;
    silentAudios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  } else {
    if (isBankEmpty()) return;
    startBtn.style.backgroundColor = "#CC422D";
    startBtn.style.color = "#d6e2ee";

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

function loadWordsFromFile(file) {
  // Сначала пытаемся загрузить данные из localStorage
  loadWordsFromStorage();

  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content.split("\n").map((line) => line.trim());

      let currentCategory = "";
      let hasValidData = false;
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
          hasValidData = true;
        }
      });

      // Сохраняем данные в localStorage
      saveWordsToStorage();
      saveFileName(file.name);

      updateWordCounts();
      updateStartButtonState();

      const startBtn = document.getElementById("startBtn");
      startBtn.disabled = !hasValidData;
      startBtn.style.opacity = hasValidData ? "1" : "0.5";
      startBtn.style.cursor = hasValidData ? "pointer" : "not-allowed";
      startBtn.style.backgroundColor = hasValidData ? "#99DBFF" : "#99DBFF";
      startBtn.style.color = hasValidData ? "#21252B" : "#21252B";

      if (!hasValidData) {
        document.getElementById("f_name").value = "Файл не выбран.";
        saveFileName("Файл не выбран.");
        document.getElementById("currentWord").textContent = "Загрузите базу и нажмите старт";
      } else {
        document.getElementById("currentWord").textContent = "Нажмите старт";
      }
    };
    reader.readAsText(file);
  }
}

function saveWordsToStorage() {
  localStorage.setItem('words', JSON.stringify(words));
  localStorage.setItem('wordsCache', JSON.stringify(wordsCache));
}

function loadWordsFromStorage() {
  const storedWords = localStorage.getItem('words');
  const storedWordsCache = localStorage.getItem('wordsCache');

  if (storedWords && storedWordsCache) {
    words = JSON.parse(storedWords);
    wordsCache = JSON.parse(storedWordsCache);
    updateWordCounts();
    updateStartButtonState();
  }
}

function saveFileName(fileName) {
  localStorage.setItem('fileName', fileName);
}

function loadFileNameFromStorage() {
  const storedFileName = localStorage.getItem('fileName');
  if (storedFileName) {
    document.getElementById("f_name").value = storedFileName;
  }
}

function clearCustomData() {
  words.nouns = [];
  words.adjectives = [];
  words.verbs = [];
  wordsCache = {
    nouns: [],
    adjectives: [],
    verbs: []
  };

  saveWordsToStorage(); // Сохраняем изменения в localStorage
  saveFileName("Файл не выбран."); // Сохраняем пустое имя файла

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

  const startBtn = document.getElementById("startBtn");
  startBtn.textContent = "Старт";
  startBtn.style.backgroundColor = "#99DBFF";
  startBtn.style.color = "#21252B";
}

document.getElementById("wordFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  loadWordsFromFile(file);
  if (Object.values(wordsCache).some(arr => arr.length > 0)) {
    document.getElementById("currentWord").textContent = "Нажмите старт";
  } else {
    document.getElementById("currentWord").textContent = "Загрузите базу и нажмите старт";
  }
});

document.getElementById("clearCustomBtn").addEventListener("click", clearCustomData);

document.getElementById("currentWord").textContent =
  "Загрузите базу и нажмите старт";

updateWordCounts();

// Проверяем, есть ли данные в localStorage при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  loadWordsFromStorage();
  loadFileNameFromStorage();

  if (Object.values(wordsCache).some(arr => arr.length > 0)) {
    document.getElementById("currentWord").textContent = "Нажмите старт";
  } else {
    document.getElementById("currentWord").textContent = "Загрузите базу и нажмите старт";
  }
});
