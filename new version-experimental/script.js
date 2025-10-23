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
        
        // Section navigation (ADD THESE)
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
   // Add this function to debug container issues
function debugContainerIssues() {
    console.log('=== DEBUG: Checking Question Containers ===');
    
    const requiredContainers = [
        'physics-section1', 'physics-section2',
        'chemistry-section1', 'chemistry-section2', 
        'chemistry-section1', 'chemistry-section2'
    ];
    
    requiredContainers.forEach(containerId => {
        const element = document.getElementById(containerId);
        console.log(`Container ${containerId}:`, element ? 'EXISTS' : 'MISSING');
        
        if (element) {
            console.log(`  - Parent:`, element.parentElement);
            console.log(`  - Visibility:`, window.getComputedStyle(element).display);
        }
    });
    
    console.log('=== DEBUG END ===');
}

    // Update the init function
    function init() {
        loadRecentTests();
        initializeTheme();
        setupEventListeners();
        updateStatistics();
        loadRecentTestsGrid();
        setupTestNavigation();
        setupSectionNavigation();
        
        // Debug containers
        setTimeout(debugContainerIssues, 1000);
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

    // ===== EVENT LISTENERS SETUP =====
    function setupEventListeners() {
        console.log('Setting up event listeners...'); // Debug log

        // Theme toggle
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
            console.log('Theme toggle listener added'); // Debug log
        }

        // Main navigation
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab(link.dataset.tab);
            });
        });

        // Test controls
        if (elements.startBtn) {
            elements.startBtn.addEventListener('click', openTestModal);
            console.log('Start button listener added'); // Debug log
        }
        
        if (elements.quickResume) {
            elements.quickResume.addEventListener('click', quickResumeTest);
            console.log('Quick resume listener added'); // Debug log
        }
        
        if (elements.endTestBtn) {
            elements.endTestBtn.addEventListener('click', openEndModal);
            console.log('End test button listener added'); // Debug log
        }
        
        if (elements.createFirstTest) {
            elements.createFirstTest.addEventListener('click', openTestModal);
            console.log('Create first test listener added'); // Debug log
        }

        // Modal controls
        if (elements.cancelBtn) {
            elements.cancelBtn.addEventListener('click', closeTestModal);
            console.log('Cancel button listener added'); // Debug log
        }
        
        if (elements.okBtn) {
            elements.okBtn.addEventListener('click', startTestFromModal);
            console.log('OK button listener added'); // Debug log
        }
        
        if (elements.endCancel) {
            elements.endCancel.addEventListener('click', closeEndModal);
            console.log('End cancel listener added'); // Debug log
        }
        
        if (elements.endOk) {
            elements.endOk.addEventListener('click', endTest);
            console.log('End OK listener added'); // Debug log
        }
        
        if (elements.modalClose) {
            elements.modalClose.addEventListener('click', closeTestModal);
            console.log('Modal close listener added'); // Debug log
        }

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

        // Add touch event listeners for mobile
        setupTouchEvents();
    }

    // ===== TOUCH EVENT SUPPORT =====
    function setupTouchEvents() {
        // Add touch events for all buttons
        const allButtons = document.querySelectorAll('button, .nav-link, .option');
        allButtons.forEach(button => {
            button.addEventListener('touchstart', function(e) {
                // Prevent double-tap zoom
                e.preventDefault();
                this.style.transform = 'scale(0.98)';
            }, { passive: false });
            
            button.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
                // Trigger click event
                this.click();
            });
        });

        // Ensure custom answer inputs work on touch devices
        document.addEventListener('touchstart', function(e) {
            if (e.target.classList.contains('custom-answer')) {
                e.target.focus();
            }
        }, { passive: true });
    }

    // ===== TEST NAVIGATION SETUP =====
    function setupTestNavigation() {
        console.log('Setting up test navigation...'); // Debug log

        // Test navigation buttons (in header)
        elements.testNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const subject = link.dataset.subject;
                console.log('Subject clicked:', subject); // Debug log
                switchSubject(subject);
                
                // Update active state
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
                    console.log('Section clicked:', section); // Debug log
                    switchSection(section);
                    
                    // Update active state
                    elements.sectionNavBtns.forEach(sectionBtn => {
                        sectionBtn.classList.remove('active');
                    });
                    btn.classList.add('active');
                });
            });
        }

        // Subject navigation buttons (if they exist)
        if (elements.subjectNavBtns) {
            elements.subjectNavBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const subject = btn.dataset.subject;
                    console.log('Subject nav clicked:', subject); // Debug log
                    switchSubject(subject);
                });
            });
        }
    }

    function switchSubject(subject) {
        console.log('Switching to subject:', subject);
        state.currentSubject = subject;
        
        // Hide all subject tabs
        document.querySelectorAll('.subject-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected subject tab
        const subjectTab = document.getElementById(subject);
        if (subjectTab) {
            subjectTab.classList.add('active');
        }
        
        // Show current section for the selected subject
        showCurrentSection();
        
        // Update progress
        updateProgress();
    }


    function switchSection(section) {
        console.log('Switching to section:', section); // Debug log
        state.currentSection = section;
        
        // Show the selected section
        showCurrentSection();
        
        // Update progress
        updateProgress();
    }

    function showCurrentSection() {
        console.log('Showing section:', state.currentSubject, state.currentSection);
        
        // Hide all section contents in current subject
        const currentSubjectTab = document.getElementById(state.currentSubject);
        if (currentSubjectTab) {
            currentSubjectTab.querySelectorAll('.section-content').forEach(content => {
                content.classList.remove('active');
            });
        }
        
        // Show current section content
        const currentSectionId = `${state.currentSubject}-${state.currentSection}`;
        const currentSection = document.getElementById(currentSectionId);
        if (currentSection) {
            currentSection.classList.add('active');
            console.log('Activated section:', currentSectionId);
        } else {
            console.log('Section not found:', currentSectionId);
            // Create the section if it doesn't exist
            const questionsContainer = document.querySelector(`#${state.currentSubject} .questions-container`);
            if (questionsContainer) {
                const newSection = document.createElement('div');
                newSection.id = currentSectionId;
                newSection.className = 'section-content active';
                questionsContainer.appendChild(newSection);
                console.log('Created section:', currentSectionId);
            }
        }
    }

    // ===== THEME FUNCTIONS =====
    function toggleTheme() {
        state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.currentTheme);
        localStorage.setItem('theme', state.currentTheme);
        updateThemeIcon();
    }

    // ===== TAB NAVIGATION =====
    function switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Update navigation
        elements.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.tab === tabName);
        });

        // Update content
        elements.tabContents.forEach(tab => {
            tab.classList.toggle('active', tab.id === tabName);
        });

        // Switch navigation based on active tab
        if (tabName === 'physics' || tabName === 'chemistry' || tabName === 'mathematics') {
            // Show test navigation, hide default navigation
            if (elements.defaultNav) elements.defaultNav.classList.add('hidden');
            if (elements.testNav) elements.testNav.classList.remove('hidden');
            if (elements.testFooter) elements.testFooter.classList.add('active');
            
            // Set initial subject and section
            state.currentSubject = tabName;
            state.currentSection = 'section1';
            
            // Ensure questions are generated for this subject
            if (state.currentTest) {
                showCurrentSection();
            }
        } else {
            // Show default navigation, hide test navigation
            if (elements.defaultNav) elements.defaultNav.classList.remove('hidden');
            if (elements.testNav) elements.testNav.classList.add('hidden');
            if (elements.testFooter) elements.testFooter.classList.remove('active');
        }
        
        // Update progress when switching tabs
        updateProgress();
    }

    // ===== TEST MODAL FUNCTIONS =====
    function openTestModal() {
        console.log('Opening test modal'); // Debug log
        if (elements.confirmModal) {
            elements.confirmModal.classList.remove('hidden');
            if (elements.testName) elements.testName.value = '';
            if (elements.section1) elements.section1.value = 20;
            if (elements.section2) elements.section2.value = 10;
        }
    }

    function closeTestModal() {
        console.log('Closing test modal'); // Debug log
        if (elements.confirmModal) elements.confirmModal.classList.add('hidden');
    }

    function openEndModal() {
        console.log('Opening end modal'); // Debug log
        if (elements.endModal) elements.endModal.classList.remove('hidden');
    }

    function closeEndModal() {
        console.log('Closing end modal'); // Debug log
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
        console.log('Starting test from modal'); // Debug log
        
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
        console.log('Quick resume test'); // Debug log
        
        const liveTest = localStorage.getItem('liveTest');
        if (liveTest) {
            const test = JSON.parse(liveTest);
            if (confirm(`Resume "${test.name}"?`)) {
                generateQuestions(test.section1Count, test.section2Count);
                startTestUI(test.name);
                startTimer();
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

        // Generate question interfaces for ALL subjects immediately
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
        
        console.log(`🚀 Generating questions for: ${containerId}`);
        console.log(`📦 Container found:`, container);
        
        if (!container) {
            console.error(`❌ CRITICAL: Container ${containerId} not found!`);
            
            // Try to create the container if it doesn't exist
            const subjectTab = document.getElementById(subject);
            if (subjectTab) {
                const questionsContainer = subjectTab.querySelector('.questions-container');
                if (questionsContainer) {
                    const newContainer = document.createElement('div');
                    newContainer.id = containerId;
                    newContainer.className = 'section-content';
                    if (section === 'section1') newContainer.classList.add('active');
                    questionsContainer.appendChild(newContainer);
                    console.log(`✅ Created missing container: ${containerId}`);
                    return generateSubjectQuestions(subject, section, count); // Retry
                }
            }
            return;
        }

        // Force display and clear container
        container.style.display = 'block';
        container.innerHTML = '';
        
        console.log(`📝 Generating ${count} questions for ${containerId}`);
        
        for (let i = 0; i < count; i++) {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            questionDiv.style.border = '2px solid #007bff'; // Visual indicator
            questionDiv.innerHTML = `
                <div class="question-header">
                    <span class="question-number" style="color: #007bff; font-weight: bold;">
                        ${subject.toUpperCase()} - Q${i + 1}
                    </span>
                </div>
                <div class="question-options">
                    <label class="option">
                        <input type="radio" name="${subject}-${section}-${i}" value="A">
                        <span>A</span>
                    </label>
                    <label class="option">
                        <input type="radio" name="${subject}-${section}-${i}" value="B">
                        <span>B</span>
                    </label>
                    <label class="option">
                        <input type="radio" name="${subject}-${section}-${i}" value="C">
                        <span>C</span>
                    </label>
                    <label class="option">
                        <input type="radio" name="${subject}-${section}-${i}" value="D">
                        <span>D</span>
                    </label>
                    <input type="text" class="custom-answer" placeholder="Or enter custom answer" 
                        data-subject="${subject}" data-section="${section}" data-index="${i}">
                </div>
            `;
            container.appendChild(questionDiv);
        }
        
        console.log(`✅ Successfully generated ${count} questions for ${containerId}`);
    }

    function handleAnswerChange(subject, section, index, answer) {
        if (!state.currentTest) return;

        const key = `${subject}${section.charAt(0).toUpperCase() + section.slice(1)}Answers`;
        if (state.currentTest[key]) {
            state.currentTest[key][index] = answer;
            updateProgress();
        }
    }

    function updateProgress() {
        if (!state.currentTest) return;

        let answered = 0;
        let total = 0;

        // Count answered questions
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
        
        // Update progress display
        if (elements.testProgress) {
            elements.testProgress.textContent = `${Math.round(progress)}% Complete`;
        }
        
        // Update progress bar
        if (elements.progressFill) {
            elements.progressFill.style.width = `${progress}%`;
        }
    }

    function setupSectionNavigation() {
        console.log('Setting up section navigation for all subjects...');
        
        // Setup section navigation for each subject
        ['physics', 'chemistry', 'mathematics'].forEach(subject => {
            const sectionNav = document.querySelector(`#${subject} .section-nav`);
            if (sectionNav) {
                const sectionBtns = sectionNav.querySelectorAll('.section-nav-btn');
                sectionBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const section = btn.dataset.section;
                        console.log(`${subject} section clicked:`, section);
                        
                        // Update active state
                        sectionBtns.forEach(sectionBtn => {
                            sectionBtn.classList.remove('active');
                        });
                        btn.classList.add('active');
                        
                        // Switch section for current subject
                        state.currentSubject = subject;
                        state.currentSection = section;
                        showCurrentSection();
                    });
                });
            }
        });
    }

    function startTestUI(testName) {
        console.log('Starting test UI:', testName);
        
        // Hide dashboard, show test interface
        switchTab('physics');
        
        // Update test info for ALL subjects
        document.querySelectorAll('.subject-tab .test-info h2').forEach(element => {
            element.textContent = testName;
        });

        // Reset navigation state
        state.currentSubject = 'physics';
        state.currentSection = 'section1';
        
        // Update active test nav button
        elements.testNavLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.subject === 'physics');
        });
        
        // Update active section button
        if (elements.sectionNavBtns) {
            elements.sectionNavBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.section === 'section1');
            });
        }
        
        // Generate questions for ALL subjects initially
        if (state.currentTest) {
            ['physics', 'chemistry', 'mathematics'].forEach(subject => {
                generateSubjectQuestions(subject, 'section1', state.currentTest.section1Count);
                generateSubjectQuestions(subject, 'section2', state.currentTest.section2Count);
            });
            
            // Show current section
            showCurrentSection();
        }

        // Auto-save interval
        if (state.autoSaveInterval) {
            clearInterval(state.autoSaveInterval);
        }
        state.autoSaveInterval = setInterval(autoSaveTest, 5000);
        
        console.log('Test UI started successfully');
    }

    function autoSaveTest() {
        if (state.currentTest) {
            const liveTest = {
                ...state.currentTest,
                estimatedSeconds: state.totalSeconds,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('liveTest', JSON.stringify(liveTest));
        }
    }

    function endTest() {
        console.log('Ending test'); // Debug log
        
        closeEndModal();
        stopTimer();
        
        // Clear auto-save interval
        if (state.autoSaveInterval) {
            clearInterval(state.autoSaveInterval);
            state.autoSaveInterval = null;
        }

        // Save to recent tests
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
            localStorage.removeItem('liveTest'); // Remove live test after saving
            updateStatistics();
            loadRecentTestsGrid();
        }

        // Reset UI
        resetTestUI();
        alert('Test completed successfully');
    }

    function resetTestUI() {
        state.currentTest = null;
        state.totalSeconds = 0;
        
        // Hide test footer
        if (elements.testFooter) elements.testFooter.classList.remove('active');
        
        // Reset navigation
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

    function checkContainers() {
        console.log('Checking if all containers exist:');
        ['physics', 'chemistry', 'mathematics'].forEach(subject => {
            ['section1', 'section2'].forEach(section => {
                const containerId = `${subject}-${section}`;
                const container = document.getElementById(containerId);
                console.log(`${containerId}:`, container ? 'FOUND' : 'NOT FOUND');
            });
        });
    }

    function debugContainerIssues() {
        console.log('=== DEBUG: Checking Question Containers ===');

        const requiredContainers = [
            'physics-section1', 'physics-section2',
            'chemistry-section1', 'chemistry-section2', 
            'chemistry-section1', 'chemistry-section2'
        ];

        requiredContainers.forEach(containerId => {
            const element = document.getElementById(containerId);
            console.log(`Container ${containerId}:`, element ? 'EXISTS' : 'MISSING');
            
            if (element) {
                console.log(`  - Parent:`, element.parentElement);
                console.log(`  - Visibility:`, window.getComputedStyle(element).display);
            }
        });

        console.log('=== DEBUG END ===');
        }
    // ===== INITIALIZE APPLICATION =====
    console.log('Initializing application...'); // Debug log
    init();
    console.log('Application initialized successfully'); // Debug log
});