// Replace the entire script.js file with this corrected version

document.addEventListener('DOMContentLoaded', () => {
    // ===== ELEMENT SELECTORS =====
    const elements = {
        startBtn: document.getElementById('start-btn'),
        quickResume: document.getElementById('quick-resume'),
        endTestBtn: document.getElementById('end-test-btn'),
        themeToggle: document.getElementById('themeToggle'),
        createFirstTest: document.getElementById('create-first-test'),
        
        // Modals
        confirmModal: document.getElementById('confirmModal'),
        endModal: document.getElementById('endModal'),
        modalClose: document.getElementById('modalClose'),
        cancelBtn: document.getElementById('cancel-btn'),
        okBtn: document.getElementById('ok-btn'),
        endCancel: document.getElementById('endCancel'),
        endOk: document.getElementById('endOk'),
        
        // Navigation
        navLinks: document.querySelectorAll('.nav-link[data-tab]'),
        tabContents: document.querySelectorAll('.tab-content'),
        
        // Display elements
        timer: document.getElementById('timer'),
        testFooter: document.getElementById('testFooter'),
        
        // Inputs
        testName: document.getElementById('test-name'),
        section1: document.getElementById('section1'),
        section2: document.getElementById('section2'),
        
        // Statistics
        totalTests: document.getElementById('totalTests'),
        completedTests: document.getElementById('completedTests'),
        
        // Test interface elements
        defaultNav: document.querySelector('.default-nav'),
        testNav: document.querySelector('.test-nav'),
        testNavLinks: document.querySelectorAll('.test-nav .nav-link'),
        currentTestName: document.getElementById('currentTestName'),
        testProgress: document.getElementById('testProgress'),
        progressFill: document.getElementById('progressFill'),
        
        // Section navigation
        sectionNavBtns: document.querySelectorAll('.section-nav-btn'),
        subjectNavBtns: document.querySelectorAll('.subject-nav-btn')
    };

    // ===== STATE MANAGEMENT =====
    let state = {
        currentTest: null,
        totalSeconds: 0,
        timerInterval: null,
        isPaused: false,
        recentTests: [],
        currentTheme: localStorage.getItem('theme') || 'light',
        currentSubject: 'physics',
        currentSection: 'section1',
        autoSaveInterval: null
    };

    // ===== INITIALIZATION =====
    function init() {
        loadRecentTests();
        initializeTheme();
        setupEventListeners();
        setupAnswerListeners();
        updateStatistics();
        loadRecentTestsGrid();
        setupTestNavigation();
        setupSectionNavigation();
        
        // Check for live test to resume
        checkLiveTest();
    }

    function checkLiveTest() {
        const liveTest = localStorage.getItem('liveTest');
        if (liveTest) {
            const test = JSON.parse(liveTest);
            if (confirm(`Found an unfinished test "${test.name}". Would you like to resume?`)) {
                state.currentTest = test;
                startTestUI(test.name);
                // Restore timer from saved state
                state.totalSeconds = test.estimatedSeconds || 0;
                startTimerInterval();
            }
        }
    }

    // ===== THEME MANAGEMENT =====
    function initializeTheme() {
        document.documentElement.setAttribute('data-theme', state.currentTheme);
        updateThemeIcon();
    }

    function updateThemeIcon() {
        if (elements.themeToggle) {
            const icon = elements.themeToggle.querySelector('i');
            icon.className = state.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    function toggleTheme() {
        state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.currentTheme);
        localStorage.setItem('theme', state.currentTheme);
        updateThemeIcon();
    }

    // ===== ANSWER HANDLING =====
    function setupAnswerListeners() {
        console.log('Setting up answer listeners...');
        
        // Use event delegation for dynamic content
        document.addEventListener('change', function(e) {
            // Handle radio button selection
            if (e.target.type === 'radio') {
                const subject = e.target.dataset.subject;
                const section = e.target.dataset.section;
                const index = parseInt(e.target.dataset.index);
                const answer = e.target.value;
                
                console.log(`Radio selected: ${subject}-${section}-${index}: ${answer}`);
                handleAnswerChange(subject, section, index, answer);
                
                // Clear custom answer for this question if radio is selected
                const customInput = document.querySelector(
                    `.custom-answer[data-subject="${subject}"][data-section="${section}"][data-index="${index}"]`
                );
                if (customInput) {
                    customInput.value = '';
                }
            }
            
            // Handle custom answer input changes
            if (e.target.classList.contains('custom-answer')) {
                const subject = e.target.dataset.subject;
                const section = e.target.dataset.section;
                const index = parseInt(e.target.dataset.index);
                const answer = e.target.value.trim();
                
                console.log(`Custom answer: ${subject}-${section}-${index}: ${answer}`);
                handleAnswerChange(subject, section, index, answer);
                
                // Clear radio buttons for this question if custom answer is entered
                const radioInputs = document.querySelectorAll(
                    `input[type="radio"][data-subject="${subject}"][data-section="${section}"][data-index="${index}"]`
                );
                radioInputs.forEach(radio => {
                    radio.checked = false;
                });
            }
        });

        // Also handle input events for custom answers for real-time updates
        document.addEventListener('input', function(e) {
            if (e.target.classList.contains('custom-answer')) {
                const subject = e.target.dataset.subject;
                const section = e.target.dataset.section;
                const index = parseInt(e.target.dataset.index);
                const answer = e.target.value.trim();
                
                handleAnswerChange(subject, section, index, answer);
            }
        });
    }

    function handleAnswerChange(subject, section, index, answer) {
        if (!state.currentTest) {
            console.log('No current test found');
            return;
        }

        // Convert section to proper format (section1 -> Section1)
        const sectionKey = section.charAt(0).toUpperCase() + section.slice(1);
        const key = `${subject}${sectionKey}Answers`;
        
        console.log(`Updating answer: ${key}[${index}] = ${answer}`);
        
        if (state.currentTest[key]) {
            state.currentTest[key][index] = answer;
            console.log(`Successfully updated: ${state.currentTest[key][index]}`);
            updateProgress();
            
            // Auto-save immediately when answer changes
            autoSaveTest();
        } else {
            console.error(`Answer array not found: ${key}`);
        }
    }

    // ===== EVENT LISTENERS SETUP =====
    function setupEventListeners() {
        console.log('Setting up event listeners...');

        // Theme toggle
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
        }

        // Main navigation
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab(link.dataset.tab);
            });
        });

        // Test controls
        if (elements.startBtn) elements.startBtn.addEventListener('click', openTestModal);
        if (elements.quickResume) elements.quickResume.addEventListener('click', quickResumeTest);
        if (elements.endTestBtn) elements.endTestBtn.addEventListener('click', openEndModal);
        if (elements.createFirstTest) elements.createFirstTest.addEventListener('click', openTestModal);

        // Modal controls
        if (elements.cancelBtn) elements.cancelBtn.addEventListener('click', closeTestModal);
        if (elements.okBtn) elements.okBtn.addEventListener('click', startTestFromModal);
        if (elements.endCancel) elements.endCancel.addEventListener('click', closeEndModal);
        if (elements.endOk) elements.endOk.addEventListener('click', endTest);
        if (elements.modalClose) elements.modalClose.addEventListener('click', closeTestModal);

        // Number controls
        document.querySelectorAll('.increase').forEach(btn => {
            btn.addEventListener('click', () => adjustNumber(btn.dataset.target, 1));
        });

        document.querySelectorAll('.decrease').forEach(btn => {
            btn.addEventListener('click', () => adjustNumber(btn.dataset.target, -1));
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (elements.confirmModal && e.target === elements.confirmModal) closeTestModal();
            if (elements.endModal && e.target === elements.endModal) closeEndModal();
        });
    }

    // ===== TEST NAVIGATION SETUP =====
    function setupTestNavigation() {
        console.log('Setting up test navigation...');

        // Test navigation buttons (in header)
        elements.testNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const subject = link.dataset.subject;
                console.log('Subject clicked:', subject);
                switchSubject(subject);
                
                elements.testNavLinks.forEach(navLink => {
                    navLink.classList.remove('active');
                });
                link.classList.add('active');
            });
        });

        // Section navigation buttons
        if (elements.sectionNavBtns) {
            elements.sectionNavBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = btn.dataset.section;
                    console.log('Section clicked:', section);
                    switchSection(section);
                    
                    elements.sectionNavBtns.forEach(sectionBtn => {
                        sectionBtn.classList.remove('active');
                    });
                    btn.classList.add('active');
                });
            });
        }
    }

    function switchSubject(subject) {
        console.log('Switching to subject:', subject);
        state.currentSubject = subject;
        
        document.querySelectorAll('.subject-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const subjectTab = document.getElementById(subject);
        if (subjectTab) {
            subjectTab.classList.add('active');
        }
        
        showCurrentSection();
        updateProgress();
    }

    function switchSection(section) {
        console.log('Switching to section:', section);
        state.currentSection = section;
        showCurrentSection();
        updateProgress();
    }

    function showCurrentSection() {
        console.log('Showing section:', state.currentSubject, state.currentSection);
        
        const currentSubjectTab = document.getElementById(state.currentSubject);
        if (currentSubjectTab) {
            currentSubjectTab.querySelectorAll('.section-content').forEach(content => {
                content.classList.remove('active');
            });
        }
        
        const currentSectionId = `${state.currentSubject}-${state.currentSection}`;
        const currentSection = document.getElementById(currentSectionId);
        if (currentSection) {
            currentSection.classList.add('active');
        }
    }

    function setupSectionNavigation() {
        console.log('Setting up section navigation for all subjects...');
        
        ['physics', 'chemistry', 'mathematics'].forEach(subject => {
            const sectionNav = document.querySelector(`#${subject} .section-nav`);
            if (sectionNav) {
                const sectionBtns = sectionNav.querySelectorAll('.section-nav-btn');
                sectionBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const section = btn.dataset.section;
                        
                        sectionBtns.forEach(sectionBtn => {
                            sectionBtn.classList.remove('active');
                        });
                        btn.classList.add('active');
                        
                        state.currentSubject = subject;
                        state.currentSection = section;
                        showCurrentSection();
                    });
                });
            }
        });
    }

    // ===== TAB NAVIGATION =====
    function switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        elements.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.tab === tabName);
        });

        elements.tabContents.forEach(tab => {
            tab.classList.toggle('active', tab.id === tabName);
        });

        if (tabName === 'physics' || tabName === 'chemistry' || tabName === 'mathematics') {
            if (elements.defaultNav) elements.defaultNav.classList.add('hidden');
            if (elements.testNav) elements.testNav.classList.remove('hidden');
            if (elements.testFooter) elements.testFooter.classList.add('active');
            
            state.currentSubject = tabName;
            state.currentSection = 'section1';
            
            if (state.currentTest) {
                showCurrentSection();
            }
        } else {
            if (elements.defaultNav) elements.defaultNav.classList.remove('hidden');
            if (elements.testNav) elements.testNav.classList.add('hidden');
            if (elements.testFooter) elements.testFooter.classList.remove('active');
        }
        
        updateProgress();
    }

    // ===== TEST MODAL FUNCTIONS =====
    function openTestModal() {
        console.log('Opening test modal');
        if (elements.confirmModal) {
            elements.confirmModal.classList.remove('hidden');
            if (elements.testName) elements.testName.value = '';
            if (elements.section1) elements.section1.value = 20;
            if (elements.section2) elements.section2.value = 10;
        }
    }

    function closeTestModal() {
        console.log('Closing test modal');
        if (elements.confirmModal) elements.confirmModal.classList.add('hidden');
    }

    function openEndModal() {
        console.log('Opening end modal');
        if (elements.endModal) elements.endModal.classList.remove('hidden');
    }

    function closeEndModal() {
        console.log('Closing end modal');
        if (elements.endModal) elements.endModal.classList.add('hidden');
    }

    function adjustNumber(target, change) {
        const input = document.getElementById(target);
        if (input) {
            let value = parseInt(input.value) || 0;
            value = Math.max(0, value + change);
            input.value = value;
        }
    }

    // ===== TEST MANAGEMENT =====
    function startTestFromModal() {
        console.log('Starting test from modal');
        
        const testName = elements.testName ? elements.testName.value.trim() : '';
        
        if (!testName) {
            alert('Please enter a test name');
            return;
        }

        const section1Count = elements.section1 ? parseInt(elements.section1.value) || 20 : 20;
        const section2Count = elements.section2 ? parseInt(elements.section2.value) || 10 : 10;

        generateQuestions(section1Count, section2Count);
        closeTestModal();
        startTestUI(testName);
        startTimer();
    }

    function quickResumeTest() {
        console.log('Quick resume test');
        
        const liveTest = localStorage.getItem('liveTest');
        if (liveTest) {
            const test = JSON.parse(liveTest);
            if (confirm(`Resume "${test.name}"?`)) {
                state.currentTest = test;
                startTestUI(test.name);
                startTimerInterval();
            }
        } else {
            alert('No previous test found to resume');
        }
    }

    function generateQuestions(s1, s2) {
        console.log('Generating questions for all subjects:', s1, s2);
        
        state.currentTest = {
            physicsSection1Answers: Array(s1).fill(null),
            physicsSection2Answers: Array(s2).fill(null),
            chemistrySection1Answers: Array(s1).fill(null),
            chemistrySection2Answers: Array(s2).fill(null),
            mathematicsSection1Answers: Array(s1).fill(null),
            mathematicsSection2Answers: Array(s2).fill(null),
            name: elements.testName ? elements.testName.value.trim() : 'Test',
            section1Count: s1,
            section2Count: s2
        };

        ['physics', 'chemistry', 'mathematics'].forEach(subject => {
            console.log(`Generating questions for ${subject}`);
            generateSubjectQuestions(subject, 'section1', s1);
            generateSubjectQuestions(subject, 'section2', s2);
        });
        
        console.log('All questions generated successfully');
    }

    function generateSubjectQuestions(subject, section, count) {
        const containerId = `${subject}-${section}`;
        const container = document.getElementById(containerId);
        
        console.log(`Generating questions for: ${containerId}`);
        
        if (!container) {
            console.error(`Container ${containerId} not found!`);
            const subjectTab = document.getElementById(subject);
            if (subjectTab) {
                const questionsContainer = subjectTab.querySelector('.questions-container');
                if (questionsContainer) {
                    const newContainer = document.createElement('div');
                    newContainer.id = containerId;
                    newContainer.className = 'section-content';
                    if (section === 'section1') newContainer.classList.add('active');
                    questionsContainer.appendChild(newContainer);
                    return generateSubjectQuestions(subject, section, count);
                }
            }
            return;
        }

        container.style.display = 'block';
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            questionDiv.innerHTML = `
                <div class="question-header">
                    <span class="question-number">
                        ${subject.toUpperCase()} - Q${i + 1}
                    </span>
                </div>
                <div class="question-options">
                    <label class="option">
                        <input type="radio" name="${subject}-${section}-${i}" value="A" 
                            data-subject="${subject}" data-section="${section}" data-index="${i}">
                        <span>A</span>
                    </label>
                    <label class="option">
                        <input type="radio" name="${subject}-${section}-${i}" value="B"
                            data-subject="${subject}" data-section="${section}" data-index="${i}">
                        <span>B</span>
                    </label>
                    <label class="option">
                        <input type="radio" name="${subject}-${section}-${i}" value="C"
                            data-subject="${subject}" data-section="${section}" data-index="${i}">
                        <span>C</span>
                    </label>
                    <label class="option">
                        <input type="radio" name="${subject}-${section}-${i}" value="D"
                            data-subject="${subject}" data-section="${section}" data-index="${i}">
                        <span>D</span>
                    </label>
                    <input type="text" class="custom-answer" placeholder="Or enter custom answer" 
                        data-subject="${subject}" data-section="${section}" data-index="${i}">
                </div>
            `;
            container.appendChild(questionDiv);
        }
    }

    function updateProgress() {
        if (!state.currentTest) return;

        let answered = 0;
        let total = 0;

        ['physics', 'chemistry', 'mathematics'].forEach(subject => {
            ['Section1', 'Section2'].forEach(section => {
                const key = `${subject}${section}Answers`;
                if (state.currentTest[key]) {
                    total += state.currentTest[key].length;
                    answered += state.currentTest[key].filter(answer => 
                        answer !== null && answer !== '' && answer !== undefined
                    ).length;
                }
            });
        });

        const progress = total > 0 ? (answered / total) * 100 : 0;
        
        if (elements.testProgress) {
            elements.testProgress.textContent = `${Math.round(progress)}% Complete`;
        }
        
        if (elements.progressFill) {
            elements.progressFill.style.width = `${progress}%`;
        }
    }

    function startTestUI(testName) {
        console.log('Starting test UI:', testName);
        
        switchTab('physics');
        
        document.querySelectorAll('.subject-tab .test-info h2').forEach(element => {
            element.textContent = testName;
        });

        state.currentSubject = 'physics';
        state.currentSection = 'section1';
        
        elements.testNavLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.subject === 'physics');
        });
        
        if (elements.sectionNavBtns) {
            elements.sectionNavBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.section === 'section1');
            });
        }
        
        if (state.currentTest) {
            ['physics', 'chemistry', 'mathematics'].forEach(subject => {
                generateSubjectQuestions(subject, 'section1', state.currentTest.section1Count);
                generateSubjectQuestions(subject, 'section2', state.currentTest.section2Count);
            });
            
            restoreSavedAnswers();
            showCurrentSection();
        }

        if (state.autoSaveInterval) {
            clearInterval(state.autoSaveInterval);
        }
        state.autoSaveInterval = setInterval(autoSaveTest, 5000);
    }

    function restoreSavedAnswers() {
        if (!state.currentTest) return;
        
        ['physics', 'chemistry', 'mathematics'].forEach(subject => {
            ['Section1', 'Section2'].forEach(section => {
                const key = `${subject}${section}Answers`;
                const answers = state.currentTest[key] || [];
                
                answers.forEach((answer, index) => {
                    if (answer && answer.trim() !== '') {
                        const radioInput = document.querySelector(
                            `input[type="radio"][data-subject="${subject}"][data-section="${section.toLowerCase()}"][data-index="${index}"][value="${answer}"]`
                        );
                        
                        if (radioInput) {
                            radioInput.checked = true;
                        } else {
                            const customInput = document.querySelector(
                                `.custom-answer[data-subject="${subject}"][data-section="${section.toLowerCase()}"][data-index="${index}"]`
                            );
                            if (customInput) {
                                customInput.value = answer;
                            }
                        }
                    }
                });
            });
        });
        
        console.log('Restored saved answers');
    }

    function autoSaveTest() {
        if (state.currentTest) {
            const liveTest = {
                ...state.currentTest,
                estimatedSeconds: state.totalSeconds,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('liveTest', JSON.stringify(liveTest));
            console.log('Auto-saved test');
        }
    }

    function endTest() {
        console.log('Ending test');
        
        closeEndModal();
        stopTimer();
        
        if (state.autoSaveInterval) {
            clearInterval(state.autoSaveInterval);
            state.autoSaveInterval = null;
        }

        if (state.currentTest) {
            const savedTest = {
                ...state.currentTest,
                date: new Date().toLocaleString(),
                estimatedSeconds: state.totalSeconds,
                id: Date.now().toString()
            };

            state.recentTests.unshift(savedTest);
            if (state.recentTests.length > 20) state.recentTests.pop();
            localStorage.setItem('recentTests', JSON.stringify(state.recentTests));
            localStorage.removeItem('liveTest');
            updateStatistics();
            loadRecentTestsGrid();
        }

        resetTestUI();
        alert('Test completed successfully');
    }

    function resetTestUI() {
        state.currentTest = null;
        state.totalSeconds = 0;
        
        if (elements.testFooter) elements.testFooter.classList.remove('active');
        switchTab('dashboard');
    }

    // ===== TIMER FUNCTIONS =====
    function startTimer() {
        state.totalSeconds = 0;
        startTimerInterval();
    }

    function startTimerInterval() {
        clearInterval(state.timerInterval);
        if (elements.timer) elements.timer.classList.remove('hidden');
        
        state.timerInterval = setInterval(() => {
            state.totalSeconds++;
            const timerText = elements.timer ? elements.timer.querySelector('span') : null;
            if (timerText) {
                timerText.textContent = formatTime(state.totalSeconds);
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(state.timerInterval);
        state.isPaused = false;
        if (elements.timer) elements.timer.classList.add('hidden');
    }

    function formatTime(sec) {
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    // ===== STATISTICS =====
    function loadRecentTests() {
        const stored = localStorage.getItem('recentTests');
        if (stored) {
            state.recentTests = JSON.parse(stored);
        }
    }

    function updateStatistics() {
        const total = state.recentTests.length;
        const completed = state.recentTests.filter(test => test.estimatedSeconds > 0).length;
        
        if (elements.totalTests) elements.totalTests.textContent = total;
        if (elements.completedTests) elements.completedTests.textContent = completed;
    }

    function loadRecentTestsGrid() {
        const grid = document.getElementById('recentTestsGrid');
        const emptyState = document.getElementById('no-recent');
        
        if (!grid || !emptyState) return;

        if (state.recentTests.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        grid.innerHTML = '';

        state.recentTests.slice(0, 6).forEach(test => {
            const testCard = document.createElement('div');
            testCard.className = 'test-card';
            testCard.innerHTML = `
                <div class="test-card-header">
                    <div>
                        <div class="test-name">${test.name || 'Unnamed Test'}</div>
                        <div class="test-date">${test.date || 'Unknown date'}</div>
                    </div>
                    <div class="test-duration">${formatTime(test.estimatedSeconds || 0)}</div>
                </div>
                <div class="test-stats">
                    <div class="test-stat">
                        <i class="fas fa-list-ol"></i>
                        ${(test.section1Count || 0) + (test.section2Count || 0)} Questions
                    </div>
                </div>
            `;
            grid.appendChild(testCard);
        });
    }

    // ===== INITIALIZE APPLICATION =====
    console.log('Initializing application...');
    init();
    console.log('Application initialized successfully');
});