// Sound effects
const correctSound = document.getElementById('correct-sound');
const wrongSound = document.getElementById('wrong-sound');
const timeoutSound = document.getElementById('timeout-sound');

// Game State
let currentQuestions = []; // Shuffled questions for the current game
let currentQuestionIndex = 0;
let score = 0;
let timer;
const TIME_PER_QUESTION = 30; // seconds
let timeLeft = TIME_PER_QUESTION;
let streak = 0; // For streak bonus
let answeredThisQuestion = false;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const shareBtn = document.getElementById('share-btn');

const questionCounter = document.getElementById('question-counter');
const currentQSpan = document.getElementById('current-q');
const totalQSpan = document.getElementById('total-q');
const timerSpan = document.getElementById('time-left');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedbackElement = document.getElementById('feedback');
const finalScoreSpan = document.getElementById('final-score');
const leaderboardList = document.getElementById('leaderboard-list');

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
shareBtn.addEventListener('click', shareScore);

// Utility: Shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Initialize Game
function startGame() {
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');

    currentQuestionIndex = 0;
    score = 0;
    streak = 0;
    currentQuestions = shuffleArray([...questions]).slice(0, 50); // Take first 50 shuffled questions
    totalQSpan.textContent = currentQuestions.length;

    loadQuestion();
    startTimer();
}

// Load Question
function loadQuestion() {
    answeredThisQuestion = false;
    feedbackElement.textContent = ''; // Clear previous feedback

    if (currentQuestionIndex >= currentQuestions.length) {
        endGame();
        return;
    }

    const questionData = currentQuestions[currentQuestionIndex];
    currentQSpan.textContent = currentQuestionIndex + 1;
    questionText.textContent = questionData.question;
    optionsContainer.innerHTML = ''; // Clear previous options

    questionData.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('option');
        optionDiv.textContent = option;
        optionDiv.dataset.index = index;
        optionDiv.addEventListener('click', selectOption);
        optionsContainer.appendChild(optionDiv);
    });

    // Reset timer
    clearInterval(timer);
    timeLeft = TIME_PER_QUESTION;
    timerSpan.textContent = timeLeft;
    startTimer();
}

// Start Timer
function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        timerSpan.textContent = timeLeft;

        if (timeLeft <= 5) {
            timerSpan.style.color = 'var(--accent-color)'; // Red color for last 5 seconds
        } else {
            timerSpan.style.color = 'var(--text-color)'; // Default color
        }

        if (timeLeft <= 0) {
            clearInterval(timer);
            timeoutSound.play();
            handleTimeout();
        }
    }, 1000);
}

// Handle Option Selection
function selectOption(event) {
    if (answeredThisQuestion) return; // Prevent multiple clicks
    answeredThisQuestion = true;
    clearInterval(timer); // Stop timer when answer is selected

    const selectedOption = event.target;
    const selectedAnswerIndex = parseInt(selectedOption.dataset.index);
    const correctAnswerIndex = currentQuestions[currentQuestionIndex].answer;

    // Disable all options
    Array.from(optionsContainer.children).forEach(option => {
        option.classList.add('disabled');
        option.removeEventListener('click', selectOption);
    });

    if (selectedAnswerIndex === correctAnswerIndex) {
        correctSound.play();
        selectedOption.classList.add('correct');
        feedbackElement.textContent = 'সঠিক উত্তর!';
        feedbackElement.style.color = 'var(--success-color)';
        
        // Calculate points: base + time bonus + streak bonus
        let questionPoints = 10; // Base points
        let timeBonus = timeLeft > 0 ? Math.round(timeLeft / 3) : 0; // Max 10 points for 30s
        streak++;
        let streakBonus = streak * 2; // +2 points per streak

        score += (questionPoints + timeBonus + streakBonus);

    } else {
        wrongSound.play();
        selectedOption.classList.add('wrong');
        feedbackElement.textContent = 'ভুল উত্তর!';
        feedbackElement.style.color = 'var(--accent-color)';
        streak = 0; // Reset streak on wrong answer

        // Highlight the correct answer
        optionsContainer.children[correctAnswerIndex].classList.add('correct');
    }

    // Wait a bit before loading the next question
    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 2000); // 2 seconds delay
}

// Handle Timeout
function handleTimeout() {
    feedbackElement.textContent = 'সময় শেষ!';
    feedbackElement.style.color = 'var(--accent-color)';
    streak = 0; // Reset streak on timeout

    // Highlight the correct answer
    const correctAnswerIndex = currentQuestions[currentQuestionIndex].answer;
    Array.from(optionsContainer.children).forEach(option => {
        option.classList.add('disabled');
        option.removeEventListener('click', selectOption);
    });
    optionsContainer.children[correctAnswerIndex].classList.add('correct');

    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 2000);
}

// End Game
function endGame() {
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');
    finalScoreSpan.textContent = score;
    clearInterval(timer); // Ensure timer is cleared

    saveScore(score);
    displayLeaderboard();
}

// Save Score to Local Storage
function saveScore(newScore) {
    const scores = JSON.parse(localStorage.getItem('quizLeaderboard')) || [];
    const entry = {
        score: newScore,
        date: new Date().toLocaleDateString('bn-BD') // Bengali date format
    };
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score); // Sort highest first
    localStorage.setItem('quizLeaderboard', JSON.stringify(scores.slice(0, 5))); // Keep top 5 scores
}

// Display Leaderboard
function displayLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('quizLeaderboard')) || [];
    leaderboardList.innerHTML = '';
    if (scores.length === 0) {
        leaderboardList.innerHTML = '<li>কোনো স্কোর এখনো নেই।</li>';
        return;
    }
    scores.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${index + 1}.</span> <span>স্কোর: ${entry.score}</span> <span>তারিখ: ${entry.date}</span>`;
        leaderboardList.appendChild(li);
    });
}

// Restart Game
function restartGame() {
    resultScreen.classList.remove('active');
    startScreen.classList.add('active'); // Go back to start screen for a fresh start
}

// Share Score
function shareScore() {
    const shareText = `আমি Black Force 007 Quiz Game-এ ${score} স্কোর করেছি! আপনিও চেষ্টা করুন!`;
    if (navigator.share) {
        navigator.share({
            title: 'Black Force 007 Quiz Game',
            text: shareText,
            url: window.location.href,
        }).then(() => {
            console.log('Share successful!');
        }).catch((error) => {
            console.error('Error sharing:', error);
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        alert(shareText + "\n(লিংক কপি করুন: " + window.location.href + ")");
        // You might want to implement a custom share dialog here
    }
}

// Initial display of leaderboard when page loads
document.addEventListener('DOMContentLoaded', displayLeaderboard);
