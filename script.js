// 1. BASE DE DATOS DE EJEMPLO
const database = [
    { id: 1, german: "machen", spanish: "hacer", perfekt: "hat gemacht", prateritum: "machte" },
    { id: 2, german: "gehen", spanish: "ir", perfekt: "ist gegangen", prateritum: "ging" },
    { id: 3, german: "sehen", spanish: "ver", perfekt: "hat gesehen", prateritum: "sah" },
    { id: 4, german: "essen", spanish: "comer", perfekt: "hat gegessen", prateritum: "aß" },
    { id: 5, german: "trinken", spanish: "beber", perfekt: "hat getrunken", prateritum: "trank" }
];

// 2. VARIABLES DE ESTADO
let userData = JSON.parse(localStorage.getItem('ankiGermanData')) || {};
let currentSessionCards = [];
let currentCardIndex = 0;

// Elementos del DOM
const selectionScreen = document.getElementById('selection-screen');
const studyScreen = document.getElementById('study-screen');
const wordListDiv = document.getElementById('word-list');
const dueCountSpan = document.getElementById('due-count');
const startBtn = document.getElementById('start-btn');
const flashcard = document.getElementById('flashcard');
const evalButtons = document.getElementById('evaluation-buttons');

// 3. INICIALIZACIÓN
function init() {
    let dueCount = 0;
    const now = new Date().getTime();

    // Crear lista de palabras
    database.forEach(word => {
        const wordData = userData[word.id];
        
        // Si ya la está estudiando, verificar si toca repaso
        if (wordData && wordData.status === 'studying') {
            if (now >= wordData.nextReview) {
                dueCount++;
            }
        } else {
            // Si es nueva, mostrarla en la lista para seleccionar
            const div = document.createElement('div');
            div.className = 'word-item';
            div.innerHTML = `
                <input type="checkbox" id="word-${word.id}" value="${word.id}">
                <label for="word-${word.id}">${word.spanish}</label>
            `;
            wordListDiv.appendChild(div);
        }
    });

    dueCountSpan.textContent = dueCount;
}

// 4. COMENZAR SESIÓN
startBtn.addEventListener('click', () => {
    currentSessionCards = [];
    const now = new Date().getTime();

    // 4a. Agregar tarjetas para repasar hoy
    database.forEach(word => {
        const wordData = userData[word.id];
        if (wordData && wordData.status === 'studying' && now >= wordData.nextReview) {
            currentSessionCards.push({ ...word, ...wordData });
        }
    });

    // 4b. Agregar tarjetas nuevas seleccionadas
    const checkboxes = document.querySelectorAll('.word-item input:checked');
    checkboxes.forEach(cb => {
        const id = parseInt(cb.value);
        const word = database.find(w => w.id === id);
        currentSessionCards.push({
            ...word,
            status: 'studying',
            interval: 0,
            ease: 2.5,
            nextReview: now
        });
    });

    if (currentSessionCards.length === 0) {
        alert("No seleccionaste palabras ni tienes repasos pendientes.");
        return;
    }

    // Barajar tarjetas
    currentSessionCards.sort(() => Math.random() - 0.5);
    
    // Cambiar pantalla
    selectionScreen.classList.add('hidden');
    studyScreen.classList.remove('hidden');
    currentCardIndex = 0;
    showCard();
});

// 5. LÓGICA DE LA FLASHCARD
flashcard.addEventListener('click', () => {
    flashcard.classList.toggle('is-flipped');
    // Mostrar botones solo cuando se ve la respuesta
    if (flashcard.classList.contains('is-flipped')) {
        evalButtons.classList.remove('hidden');
    } else {
        evalButtons.classList.add('hidden');
    }
});

function showCard() {
    if (currentCardIndex >= currentSessionCards.length) {
        alert("¡Sesión terminada! Buen trabajo.");
        location.reload(); // Recargar para volver al inicio
        return;
    }

    document.getElementById('cards-left').textContent = currentSessionCards.length - currentCardIndex;
    const card = currentSessionCards[currentCardIndex];
    
    document.getElementById('card-german').textContent = card.german;
    document.getElementById('card-spanish').textContent = card.spanish;
    document.getElementById('card-perfekt').textContent = card.perfekt;
    document.getElementById('card-prateritum').textContent = card.prateritum;
    
    flashcard.classList.remove('is-flipped');
    evalButtons.classList.add('hidden');
}

// 6. ALGORITMO DE APRENDIZAJE ESPACIADO (SuperMemo-2 simplificado)
function evaluateCard(isCorrect) {
    const card = currentSessionCards[currentCardIndex];
    
    if (isCorrect) {
        if (card.interval === 0) {
            card.interval = 1; // 1 día
        } else if (card.interval === 1) {
            card.interval = 6; // 6 días
        } else {
            card.interval = Math.round(card.interval * card.ease);
        }
    } else {
        card.interval = 0; // Volver a empezar
        card.ease = Math.max(1.3, card.ease - 0.15); // Disminuir facilidad
    }

    // Calcular próxima fecha de repaso
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + card.interval);
    card.nextReview = nextDate.getTime();

    // Guardar en LocalStorage
    userData[card.id] = {
        status: 'studying',
        interval: card.interval,
        ease: card.ease,
        nextReview: card.nextReview
    };
    localStorage.setItem('ankiGermanData', JSON.stringify(userData));

    // Si fue incorrecta, mandarla al final de la sesión para volver a verla hoy
    if (!isCorrect) {
        currentSessionCards.push({...card}); 
    }

    currentCardIndex++;
    showCard();
}

// Arrancar la app
init();
