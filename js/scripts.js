const TrainingModulesPage = {
  template: `
    <div class="content">
      <h2 v-if="!currentUser">Login For Assigned Training</h2>
      <div class="module-cards">
        <div v-for="unit in assignedTrainingUnits" :key="unit.id" 
             class="module-card" :class="getClass(unit)" 
             @click="expandCard(unit)">
          <h3>{{ unit.name }}</h3>
          <p v-if="!isExpanded(unit)">{{ unit.section }} - {{ unit.subSection }}</p>
          <p v-if="!isExpanded(unit)">Difficulty: {{ getDifficultyLabel(unit) }} ({{ unit.approxLength }})</p>
          <p v-if="!isExpanded(unit)">Type: {{ getTypeLabel(unit) }}</p>
          <p v-if="!isExpanded(unit) && currentUser">Progress: {{ getProgress(unit) }}</p>

          <div v-if="isExpanded(unit)" @click.stop ref="content" class="module-card-container">
            <button class="close-button button" @click.stop="closeExpanded">X</button>
            <div v-show="showInfo">
              <p>Difficulty: {{ unit.difficultyRating }}</p>
              <p>Approx. Length: {{ unit.approxLength }}</p>
              <p>Target Audience: {{ unit.audienceType }} - {{ unit.target }}</p>
              <p>Section: {{ unit.section }} - {{ unit.subSection }}</p>
            </div>
            <button class="toggle-info-button" @click="toggleInfo">Toggle Info</button>

            <div v-if="unit.type === 'video'" class="module-card-content">
              <ul>
                <li v-for="video in unit.videos" :key="video.url">
                  <p>{{ video.title }}</p>
                  <div v-if="isYouTubeUrl(video.url)">
                    <div v-if="!loadedContent[video.url]" class="loading-spinner-container">
                      <div class="loading-spinner"></div>
                    </div>
                    <iframe v-show="loadedContent[video.url]" :src="getYouTubeEmbedUrl(video.url)" frameborder="0" allowfullscreen @load="markContentAsLoaded(video.url)"></iframe>
                  </div>
                  <div v-else>
                    <a :href="video.url" target="_blank">{{ video.title }}</a>
                  </div>
                </li>
              </ul>
            </div>

            <div v-if="unit.type === 'quiz'" class="module-card-content">
              <h4>Quiz</h4>
              <div v-if="quizCompleted">
                <h4>Quiz Completed!</h4>
                <ul>
                  <li v-for="(question, index) in unit.quiz" :key="index">
                    <p>{{ question.question }}</p>
                    <ul class="quiz-options">
                      <li v-for="(option, optionIndex) in question.options" :key="optionIndex">
                        <span :style="{ fontWeight: optionIndex === question.correctOption ? 'bold' : 'normal' }">{{ option }}</span>
                      </li>
                    </ul>
                  </li>
                </ul>
                <button @click="resetQuiz(unit.id)" class="reset-button button">Reset Quiz</button>
              </div>
              <div v-else>
                <div v-for="(question, index) in unit.quiz" :key="index" v-if="currentQuestionIndex === index">
                  <p class="quiz-question">{{ question.question }}</p>
                  <ul class="quiz-options">
                    <li v-for="(option, optionIndex) in question.options" :key="optionIndex">
                      <button @click="selectOption(unit.id, index, optionIndex)" class="quiz-option">{{ option }}</button>
                    </li>
                  </ul>
                  <p class="question-counter">Question {{ currentQuestionIndex + 1 }} of {{ unit.quiz.length }}</p>
                </div>
              </div>
            </div>

            <div v-if="unit.type === 'slideshow'" class="module-card-content">
              <ul>
                <li v-for="(slide, index) in unit.slideshow" :key="index">
                  <div v-if="!loadedContent[slide.url]" class="loading-spinner-container">
                    <div class="loading-spinner"></div>
                  </div>
                  <img v-show="loadedContent[slide.url]" :src="slide.url" alt="Slide Image" width="100%" @load="markContentAsLoaded(slide.url)" />
                  <p>{{ slide.description }}</p>
                </li>
              </ul>
            </div>

            <div v-if="unit.type === 'pdf-guide'" class="module-card-content">
              <ul>
                <li v-for="guide in unit.pdfGuides" :key="guide.url" class="pdf-guide-item">
                  <div>
                    <a :href="guide.url" target="_blank" class="pdf-guide-link">{{ guide.title }}</a>&nbsp;-&nbsp;<span>{{ guide.description }}</span>
                  </div>
                  <div class="zoom-controls">
                    <button class="zoom-button" @click="zoomOut"><i class="fas fa-search-minus"></i></button>
                    <button class="zoom-button" @click="zoomIn"><i class="fas fa-search-plus"></i></button>
                  </div>
                  <div class="pdf-viewer-container">
                    <div class="pdf-navigation pdf-backward" @click="changePage('backward', guide.url, unit.id)">
                      <button class="fas fa-arrow-left"></button>
                    </div>
                    <div v-if="!loadedContent[guide.url + '-page-' + currentPage]" class="loading-spinner-container">
                      <div class="loading-spinner"></div>
                    </div>
                    <canvas :id="'pdf-canvas-' + guide.url" class="pdf-canvas" :style="{ height: zoomHeight }"></canvas>
                    <div class="pdf-navigation pdf-forward" @click="changePage('forward', guide.url, unit.id)">
                      <button class="fas fa-arrow-right"></button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div v-if="unit.type === 'embedded-guide'" class="module-card-content">
              <ul>
                <li v-for="guide in unit.embeddedGuides" :key="guide.title">
                  <div v-if="!loadedContent[guide.title]" class="loading-spinner-container">
                    <div class="loading-spinner"></div>
                  </div>
                  <div v-show="loadedContent[guide.title]" v-html="guide.embedCode" @load="markContentAsLoaded(guide.title)"></div>
                  <p>{{ guide.description }}</p>
                </li>
              </ul>
            </div>

            <div v-if="unit.type === 'simulation'" class="module-card-content">
              <h4>Simulation</h4>
              <div v-for="(step, index) in unit.simulation" :key="index" v-if="currentStepIndex === index">
                <p>{{ step.description }}</p>
                <div v-if="!loadedContent[step.url]" class="loading-spinner-container">
                  <div class="loading-spinner"></div>
                </div>
                <img v-show="loadedContent[step.url]" :src="step.url" alt="Simulation Step Image" width="100%" @load="markContentAsLoaded(step.url)" @click="checkCoordinates($event, step.coordinates, unit.id)" />
                <p v-if="feedback !== null">{{ feedback }}</p>
                <button v-if="feedback === 'Correct!'" @click="nextStep(unit)">Next</button>
              </div>
            </div>

          </div>
        </div>
      </div>
      <div class="scroll-arrow">
        <i class="fas fa-arrow-down"></i>
      </div>
      <div v-if="expandedUnit" class="overlay" @click="closeExpanded"></div>
      <div v-if="showFeedbackModal" class="modal-overlay">
        <div class="modal-content">
          <p>{{ feedback }}</p>
          <button @click="closeFeedbackModal">{{ feedback === 'Correct!' ? 'Next' : 'Try Again' }}</button>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      currentUser: null,
      allTrainingUnits: [],
      expandedUnit: null,
      loadedContent: {},
      currentQuestionIndex: 0,
      currentStepIndex: 0,
      feedback: null,
      showInfo: false,
      showFeedbackModal: false,
      quizCompleted: false,
      pdfPageNumbers: {},
      currentPage: 1,
      zoomHeight: '100vh',
      pdfDocuments: {}
    };
  },
  computed: {
    assignedTrainingUnits() {
      if (!Array.isArray(this.allTrainingUnits) || !this.currentUser || !Array.isArray(this.currentUser.assignedTrainingUnits)) {
        return this.allTrainingUnits.filter(unit => unit.id === 'sitedemo1');
      }
      const assignedIds = this.currentUser.assignedTrainingUnits.map(unit => unit.unitId);
      return this.allTrainingUnits.filter(unit => assignedIds.includes(unit.id));
    }
  },
  methods: {
    updateUserData(newUser) {
      this.currentUser = newUser;
      this.fetchAllTrainingUnits();
    },
    async fetchAllTrainingUnits() {
      try {
        const response = await fetch('PHP/get_training_units.php');
        const data = await response.json();
        if (data.units) {
          this.allTrainingUnits = data.units;
        } else {
          console.warn('No training units found in the response.');
        }
      } catch (err) {
        console.error('Error loading training units:', err);
      }
    },
    getDifficultyLabel(unit) {
      switch (unit.difficultyRating) {
        case 1:
          return 'Easy';
        case 2:
          return 'Medium';
        case 3:
          return 'Hard';
        default:
          return 'Unknown';
      }
    },
    getTypeLabel(unit) {
      switch (unit.type) {
        case 'video':
          return 'Video';
        case 'quiz':
          return 'Quiz';
        case 'slideshow':
          return 'Slideshow';
        case 'pdf-guide':
          return 'Document';
        case 'embedded-guide':
          return 'Document';
        case 'simulation':
          return 'Simulation';
        default:
          return 'Unknown';
      }
    },
    getProgress(unit) {
      const userUnit = this.currentUser.assignedTrainingUnits.find(u => u.unitId === unit.id);
      if (!userUnit) return 'Not started';
      const progress = userUnit.progress || {};

      switch (unit.type) {
        case 'video':
          return 'Placeholder';
        case 'quiz':
          return `${progress.currentQuestionIndex || 0} of ${unit.quiz.length}`;
        case 'slideshow':
          return 'Placeholder';
        case 'pdf-guide':
          console.log('This unit:', unit, 'Progress:', progress.currentPage);
          return `Page ${progress.currentPage || 1} of ${unit.pdfGuides[0].pdfLength || 'Unknown'}`;
        case 'embedded-guide':
          return 'Placeholder';
        case 'simulation':
          return `${progress.currentStepIndex || 0} of ${unit.simulation.length}`;
        default:
          return 'Not started';
      }
    },
    expandCard(unit) {
      console.log('Expanding unit:', unit);
      let unitProgress = this.currentUser ? this.currentUser.assignedTrainingUnits.find(u => u.unitId === unit.id).progress || {} : {};
      let unitProgressQuestionIndex = unitProgress.currentQuestionIndex || 0;
      this.expandedUnit = unit.id;
      this.currentQuestionIndex = unitProgressQuestionIndex;
      this.currentStepIndex = 0;
      this.feedback = null;
      this.showInfo = false;
      this.quizCompleted = this.checkIfQuizCompleted(unit, unitProgressQuestionIndex);
      this.$nextTick(() => {
        this.startScrollCheck(unit.id);
        if (unit.type === 'pdf-guide') {
          const currentPage = unitProgress.currentPage || 1;
          this.currentPage = currentPage;
          this.renderPDF(unit, currentPage);
        }
      });
    },
    closeExpanded() {
      this.expandedUnit = null;
      clearInterval(this.scrollCheckInterval);
      this.hideScrollArrow();
    },
    isExpanded(unit) {
      return this.expandedUnit === unit.id;
    },
    getClass(unit) {
      const classes = [];
      if (this.isExpanded(unit)) {
        classes.push('expanded');
      }
      classes.push(unit.type);
      return classes;
    },
    isYouTubeUrl(url) {
      const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
      return regex.test(url);
    },
    getYouTubeEmbedUrl(url) {
      const videoId = url.split('v=')[1] || url.split('youtu.be/')[1];
      const ampersandPosition = videoId.indexOf('&');
      if (ampersandPosition !== -1) {
        return `https://www.youtube.com/embed/${videoId.substring(0, ampersandPosition)}`;
      }
      return `https://www.youtube.com/embed/${videoId}`;
    },
    markContentAsLoaded(url) {
      this.$set(this.loadedContent, url, true);
    },
    selectOption(unitId, questionIndex, optionIndex) {
      const unit = this.assignedTrainingUnits.find(u => u.id === unitId);
      const question = unit.quiz[questionIndex];
      if (question.correctOption === optionIndex) {
        this.feedback = 'Correct!';
        this.updateUserProgress(unitId);
        this.showFeedbackModal = true;
      } else {
        this.feedback = 'Incorrect. Try again.';
        this.showFeedbackModal = true;
      }
    },
    checkCoordinates(event, coordinates, unitId) {
      const [x1, y1, x2, y2] = coordinates.split(',').map(Number);
      const { offsetX, offsetY } = event;
      if (offsetX >= x1 && offsetX <= x2 && offsetY >= y1 && y2) {
        this.feedback = 'Correct!';
        this.updateUserProgress(unitId);
      } else {
        this.feedback = 'Incorrect. Try again.';
        console.log('Incorrect coordinates: ', offsetX, offsetY, 'Should be between: ', x1, y1, x2, y2);
      }
      this.showFeedbackModal = true;
    },
    nextQuestion(unit) {
      if (this.currentQuestionIndex < unit.quiz.length - 1) {
        this.currentQuestionIndex++;
        this.feedback = null;
        this.showFeedbackModal = false;
      } else {
        this.feedback = 'Quiz completed!';
        this.quizCompleted = true;
        this.showFeedbackModal = false;
      }
    },
    nextStep(unit) {
      this.currentStepIndex++;
      this.feedback = null;
      if (this.currentStepIndex >= unit.simulation.length) {
        alert('Simulation completed!');
        this.currentStepIndex = 0;
      }
    },
    async updateUserProgress(unitId) {
      const unit = this.assignedTrainingUnits.find(u => u.id === unitId);
      const progressData = {
        currentQuestionIndex: this.currentQuestionIndex + 1,
        currentStepIndex: this.currentStepIndex + 1,
        currentPage: this.currentPage // Update with current page for PDF guides
      };
      const unitProgress = unit.progress || {};
      Object.assign(unitProgress, progressData);
      unit.progress = unitProgress;

      const user = this.currentUser;
      const unitIndex = user.assignedTrainingUnits.findIndex(u => u.unitId === unitId);
      if (unitIndex !== -1) {
        this.currentUser.assignedTrainingUnits[unitIndex].progress = unit.progress;
      }

      try {
        const response = await fetch('PHP/update_users.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: [this.currentUser] })
        });
        const result = await response.json();
        if (!result.success) {
          console.error('Error updating user progress:', result.message);
        }
      } catch (err) {
        console.error('Error updating user progress:', err);
      }
    },
    toggleInfo() {
      let zoom = document.querySelector('.zoom-controls');
      let arrows = document.querySelectorAll('.pdf-navigation');
      this.showInfo = !this.showInfo;
      
      if (zoom) {
        zoom.style.top = this.showInfo ? '42%' : '20%';
      }
      
      if (arrows.length) {
        arrows.forEach(arrow => {
          arrow.style.top = this.showInfo ? '43%' : '11.5%';
        });
      }
    },
    startScrollCheck(unitId) {
      setTimeout(() => {
        this.scrollCheckInterval = setInterval(() => this.checkScroll(unitId), 100);
      }, 30); // Delay for 30ms
    },
    checkScroll(unitId) {
      const content = document.querySelector('.module-card-content');
      if (content) {
        const arrow = document.querySelector('.scroll-arrow');
        if (arrow) {
          const shouldDisplayArrow = this.hasScrollableContent(content) && !this.isAtBottom(content);
          arrow.style.display = shouldDisplayArrow ? 'block' : 'none';
        }
      }
      else {
        alert('Content not found!');
      }
    },
    hasScrollableContent(element) {
      const buffer = 0;
      const isOverflowing = (element.scrollHeight - element.clientHeight) > buffer;
      console.log('Is overflowing:', isOverflowing, 'Scroll height:', element.scrollHeight, 'Client height:', element.clientHeight);
      return isOverflowing;
    },
    isAtBottom(element) {
      const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
      return atBottom;
    },
    hideScrollArrow() {
      const arrow = document.querySelector('.scroll-arrow');
      if (arrow) {
        arrow.style.display = 'none';
      }
    },
    closeFeedbackModal() {
      this.showFeedbackModal = false;
      if (this.feedback === 'Correct!') {
        const unit = this.assignedTrainingUnits.find(u => u.id === this.expandedUnit);
        this.nextQuestion(unit);
      }
    },
    checkIfQuizCompleted(unit, currentIndex) {
      return currentIndex >= unit.quiz.length;
    },
    async resetQuiz(unitId) {
      this.currentQuestionIndex = 0;
      this.feedback = null;
      this.quizCompleted = false;

      const user = this.currentUser;
      const unitIndex = user.assignedTrainingUnits.findIndex(u => u.unitId === unitId);
      if (unitIndex !== -1) {
        this.currentUser.assignedTrainingUnits[unitIndex].progress = {
          currentQuestionIndex: 0,
          currentStepIndex: 0,
          currentPage: 1
        };

        try {
          const response = await fetch('PHP/update_users.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: [this.currentUser] })
          });
          const result = await response.json();
          if (!result.success) {
            console.error('Error updating user progress:', result.message);
          }
        } catch (err) {
          console.error('Error updating user progress:', err);
        }
      }
    },
    async renderPDF(unit, currentPage = 1) {
      const pdfGuides = unit.pdfGuides;
      for (let guide of pdfGuides) {
        const url = guide.url;
        if (!url) continue;
        const canvas = document.getElementById(`pdf-canvas-${url}`);
        const context = canvas.getContext('2d');

        // Check if the PDF document is already loaded
        if (!this.pdfDocuments[url]) {
          const loadingTask = pdfjsLib.getDocument(url);
          try {
            const pdf = await loadingTask.promise;
            this.$set(this.pdfDocuments, url, pdf); // Store the loaded PDF document
            this.$set(this.pdfPageNumbers, url, currentPage);
            unit.pdfLength = pdf.numPages; // Set the total number of pages
            this.renderPage(pdf, currentPage, canvas, context, url);
          } catch (err) {
            console.error('Error loading PDF:', err);
          }
        } else {
          const pdf = this.pdfDocuments[url];
          this.renderPage(pdf, currentPage, canvas, context, url);
        }
      }
    },
    renderPage(pdf, pageNumber, canvas, context, url) {
      pdf.getPage(pageNumber).then(page => {
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        page.render(renderContext).promise.then(() => {
          this.$set(this.pdfPageNumbers, url, pageNumber);
          this.currentPage = pageNumber; // Update current page globally
          this.updateUserProgress(this.expandedUnit); // Update progress when page is rendered
          // Set loading state to true once rendering is complete
          this.$set(this.loadedContent, `${url}-page-${pageNumber}`, true);
          this.$set(this.loadedContent, `${url}-page-${this.currentPage}`, true);
        });
      });
    },
    changePage(direction, url, unitId) {
      const canvas = document.getElementById(`pdf-canvas-${url}`);
      const context = canvas.getContext('2d');
      const currentPage = this.pdfPageNumbers[url];

      const newPage = direction === 'forward' ? currentPage + 1 : currentPage - 1;

      // Set loading state for both current and new pages
      this.$set(this.loadedContent, `${url}-page-${newPage}`, false);
      this.$set(this.loadedContent, `${url}-page-${currentPage}`, false);

      const pdf = this.pdfDocuments[url];
      if (pdf) {
        if (direction === 'forward' && currentPage < pdf.numPages) {
          this.renderPage(pdf, newPage, canvas, context, url);
        } else if (direction === 'backward' && currentPage > 1) {
          this.renderPage(pdf, newPage, canvas, context, url);
        }
      }
    },
    zoomIn() {
      this.adjustZoom(0.5);
    },
    zoomOut() {
      this.adjustZoom(-0.5);
    },
    adjustZoom(delta) {
      const currentHeight = parseFloat(this.zoomHeight);
      const newHeight = currentHeight + delta * 10;
      if (newHeight > 50 && newHeight < 200) {
        this.zoomHeight = newHeight + 'vh';
      }
    }
  },
  created() {
    this.currentUser = this.$root.currentUserDetails;
    this.$root.$on('user-updated', this.updateUserData);
    this.fetchAllTrainingUnits();
  },
  beforeDestroy() {
    this.$root.$off('user-updated', this.updateUserData);
  }
};

const ContactView = {
  template: `
    <div class="content">
      <h2>Submit Support Ticket (Placeholder)</h2>
      <p>Might be able to embed our support form here</p>
      <form @submit.prevent="submitForm">
        <label for="name">Name:</label>
        <input type="text" v-model="name" required>
        <span v-if="nameError">{{ nameError }}</span>

        <label for="email">Email:</label>
        <input type="email" v-model="email" required>
        <span v-if="emailError">{{ emailError }}</span>

        <button type="submit">Submit</button>
      </form>
    </div>
  `,
  data() {
    return {
      name: '',
      email: '',
      nameError: '',
      emailError: ''
    };
  },
  methods: {
    submitForm() {
      this.nameError = '';
      this.emailError = '';

      if (this.name.length < 2) {
        this.nameError = 'Name must be at least 2 characters.';
      }
      if (!this.email.includes('@')) {
        this.emailError = 'Please enter a valid email.';
      }
      if (!this.nameError && !this.emailError) {
        alert('Form submitted successfully!' + '\n' + 'Name: ' + this.name + '\n' + 'Email: ' + this.email);
      }
    }
  }
};

const BookingPage = {
  template: `
    <div class="content">
      <h2>Book a Training Session (Placeholder)</h2>
      <p>I'm hoping to embed our booking form here</p>
    </div>
  `,
};

const LeaderboardPage = {
  template: `
    <div class="content">
      <h2>Leaderboard (Placeholder)</h2>
      <p>Leaderboard showing user progress comparison</p>
    </div>
  `,
};

const UserInformationPage = {
  template: `
    <div class="content">
      <h2>User Information</h2>
      <p>I'm still implementing this, I want to make the info editable</p>
      <div v-if="currentUser">
        <p><strong>Name:</strong> {{ currentUser.name }}</p>
        <p><strong>Locked:</strong> {{ currentUser.locked }} (Placeholder for the user currently being logged in)</p>
        <p><strong>Last Interaction:</strong> {{ currentUser.lastInteraction }} (Placeholder for the user currently being logged in)</p>
        <p><strong>Email:</strong> {{ currentUser.email }}</p>
        <h3>Assigned Training Units</h3>
        <ul>
          <li v-for="unit in matchedUnits" :key="unit.id">
            <p>{{ unit.name }} - Progress: {{ getProgress(unit) }}</p>
          </li>
        </ul>
      </div>
      <div v-else>
        <p>Login to see user information.</p>
      </div>
      <p>The current date and time is: {{ currentTime }}</p>
    </div>
  `,
  data() {
    return {
      currentUser: null,
      allTrainingUnits: [],
      currentTime: new Date().toLocaleString()
    };
  },
  computed: {
    matchedUnits() {
      if (!this.currentUser || !this.currentUser.assignedTrainingUnits) {
        return [];
      }
      return this.currentUser.assignedTrainingUnits.map(assignedUnit => {
        const unit = this.allTrainingUnits.find(unit => unit.id === assignedUnit.unitId);
        if (unit) {
          return { ...unit, progress: assignedUnit.progress };
        }
        return null;
      }).filter(unit => unit !== null);
    }
  },
  methods: {
    updateUserData(newUser) {
      this.currentUser = newUser;
    },
    async fetchAllTrainingUnits() {
      try {
        const response = await fetch('PHP/get_training_units.php');
        const data = await response.json();
        if (data.units) {
          this.allTrainingUnits = data.units;
        } else {
          console.warn('No training units found in the response.');
        }
      } catch (err) {
        console.error('Error loading training units:', err);
      }
    },
    getProgress(unit) {
      if (!unit.progress) {
        return 'Not started';
      }

      switch (unit.type) {
        case 'video':
          return `Placeholder (% Of video watched)`;
        case 'quiz':
          return `${unit.progress.currentQuestionIndex || 0} answered out of ${unit.quiz.length}`;
        case 'slideshow':
          return `Placeholder (Number of slides viewed)`;
        case 'pdf-guide':
          return `Page ${unit.progress.currentPage || 0} of ${unit.pdfGuides[0].pdfLength || 'Unknown'}`;
        case 'embedded-guide':
          return `Placeholder (Number of pages viewed)`;
        case 'simulation':
          return `Step ${unit.progress.currentStepIndex || 0} of ${unit.simulation.length}`;
        default:
          return 'Not started';
      }
    }
  },
  created() {
    // Set the initial state from the root instance
    this.currentUser = this.$root.currentUserDetails;

    // Listen for the user-updated event to update this component's data
    this.$root.$on('user-updated', this.updateUserData);

    // Fetch all training units
    this.fetchAllTrainingUnits();

    // Update current time every second
    setInterval(() => {
      this.currentTime = new Date().toLocaleString();
    }, 1000);
  },
  beforeDestroy() {
    // Clean up event listeners when the component is destroyed
    this.$root.$off('user-updated', this.updateUserData);
  }
};

const ManageUsersPage = {
  template: `
    <div class="content">
      <h2>Assign Training Units to Users
        <button @click="showAddUserModal = true" style="float: right;">Add New User</button>
      </h2>
      <div v-if="showAddUserModal" class="modal-overlay">
        <div class="modal-content">
          <h2>Add New User</h2>
          <form @submit.prevent="addNewUser">
            <label for="name">Name:</label>
            <input type="text" v-model="newUserName" required />
            <label for="email">Email:</label>
            <input type="text" v-model="newUserEmail" required />
            <br />
            <button type="submit">Add User</button>
            <button type="button" @click="showAddUserModal = false">Cancel</button>
          </form>
        </div>
      </div>
      <div v-if="isLoading" class="modal-overlay">
        <div class="loading-spinner"></div>
      </div>
      <div v-else>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th v-for="unit in allTrainingUnits" :key="unit.id" :title="truncate(unit.name, 40)">{{ truncate(unit.name, 15) }}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.name">
              <td>{{ user.name }}</td>
              <td v-for="unit in allTrainingUnits" :key="unit.id">
                <input type="checkbox"
                  :checked="isUnitAssignedToUser(user, unit)"
                  @change="toggleUnitAssignment(user, unit, $event.target.checked)"
                />
              </td>
              <td>
                <button @click="removeUser(user.name)">Remove {{ truncate(user.name) }}</button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td></td>
              <td v-for="unit in allTrainingUnits" :key="unit.id">
                <button @click="removeUnit(unit.id)">Remove {{ truncate(unit.name, 5) }}</button>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        <button @click="saveAssignments">Save Assignments</button>
      </div>
    </div>
  `,
  data() {
    return {
      users: [],
      allTrainingUnits: [],
      showAddUserModal: false,
      newUserName: '',
      newUserEmail: '',
      isLoading: false
    };
  },
  methods: {
    async fetchAllUsers() {
      this.isLoading = true;
      try {
        const response = await fetch('PHP/get_users.php');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();

        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          console.error('Expected an object of users, received:', data);
          return;
        }

        const userDetailsPromises = Object.keys(data).map(async key => {
          const userName = data[key];
          const userDetailsResponse = await fetch(`PHP/get_user_details.php?name=${encodeURIComponent(userName)}`);
          if (!userDetailsResponse.ok) {
            throw new Error('Failed to fetch user details');
          }
          const userDetails = await userDetailsResponse.json();
          return { ...userDetails, id: key, name: userName };
        });

        this.users = await Promise.all(userDetailsPromises);
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        this.isLoading = false;
      }
    },
    async fetchAllTrainingUnits() {
      this.isLoading = true;
      try {
        const response = await fetch('PHP/get_training_units.php');
        if (!response.ok) {
          throw new Error('Failed to fetch training units');
        }
        const data = await response.json();
        if (data.units) {
          this.allTrainingUnits = data.units;
        } else {
          console.warn('No training units found in the response.');
        }
        // console.log('Training units fetched:', this.allTrainingUnits);
      } catch (err) {
        console.error('Error loading training units:', err);
      } finally {
        this.isLoading = false;
      }
    },
    isUnitAssignedToUser(user, unit) {
      return user.assignedTrainingUnits && user.assignedTrainingUnits.some(assigned => assigned.unitId === unit.id);
    },
    toggleUnitAssignment(user, unit, isChecked) {
      if (!Array.isArray(user.assignedTrainingUnits)) {
        user.assignedTrainingUnits = [];
      }

      if (isChecked) {
        if (!user.assignedTrainingUnits.some(assigned => assigned.unitId === unit.id)) {
          user.assignedTrainingUnits.push({ unitId: unit.id, title: unit.name, progress: {} });
        }
      } else {
        user.assignedTrainingUnits = user.assignedTrainingUnits.filter(assigned => assigned.unitId !== unit.id);
      }
    },
    async saveAssignments() {
      this.isLoading = true;
      try {
        const response = await fetch('PHP/update_users.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: this.users })
        });
        const result = await response.json();
        if (result.success) {
          // alert('Assignments saved successfully.');
          this.$root.$emit('user-updated');
        } else {
          console.error('Error saving assignments:', result.message);
        }
      } catch (err) {
        console.error('Error saving assignments:', err);
      } finally {
        this.isLoading = false;
      }
    },
    async addNewUser() {
      // console.log('Adding new user:', this.newUserName, this.newUserEmail);
      this.isLoading = true;
      try {
        const response = await fetch('PHP/add_user.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: this.newUserName, email: this.newUserEmail })
        });
        const result = await response.json();
        if (result.success) {
          this.showAddUserModal = false;
          await this.fetchAllUsers();  // Refresh the user list
          this.$root.$emit('user-updated');
        } else {
          console.error('Error adding user:', result.message);
        }
      } catch (err) {
        console.error('Error adding user:', err);
      } finally {
        this.isLoading = false;
      }
    },
    async removeUser(userName) {
      console.log('Removing user:', userName);
      this.isLoading = true;
      try {
        const response = await fetch('PHP/remove_user.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: userName })
        });
        const result = await response.json();
        if (result.success) {
          this.$root.$emit('user-updated');
          await this.fetchAllUsers();  // Refresh the user list
        } else {
          console.error('Error removing user:', result.message);
        }
      } catch (err) {
        console.error('Error removing user:', err);
      } finally {
        this.isLoading = false;
      }
    },
    async removeUnit(unitId) {
      console.log('Removing unit:', unitId);
      this.isLoading = true;
      try {
        const response = await fetch('PHP/remove_unit.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: unitId })
        });
        const result = await response.json();
        if (result.success) {
          await this.fetchAllTrainingUnits();  // Refresh the units list
        } else {
          console.error('Error removing unit:', result.message);
        }
      } catch (err) {
        console.error('Error removing unit:', err);
      } finally {
        this.isLoading = false;
      }
    },
    truncate(text, length = 10) {
      return text.length > length ? text.substring(0, length) + '...' : text;
    }
  },
  async created() {
    await this.fetchAllUsers();
    await this.fetchAllTrainingUnits();
  }
};

/*<div>
  <label for="difficultyRating">Difficulty Rating:</label>
  <select v-model="newModule.difficultyRating" required>
    <option value="1">Easy</option>
    <option value="2">Medium</option>
    <option value="3">Hard</option>
  </select>
</div>*/

const ModuleBuilder = {
  template: `
    <div class="content module-builder">
      <h2>Module Builder</h2>
      <form @submit.prevent="addModule" class="module-builder-form">
        <div class="form-group">
          <label for="type">Type:</label>
          <select v-model="newModule.type" required class="form-control">
            <option value="video">Video</option>
            <option value="quiz">Quiz</option>
            <option value="slideshow">Slideshow</option>
            <option value="pdf-guide">PDF Guide</option>
            <option value="embedded-guide">Embedded Guide</option>
            <option value="simulation">Simulation</option>
          </select>
        </div>
        <div class="form-group">
          <label for="name">Name:</label>
          <input type="text" v-model="newModule.name" required class="form-control" />
        </div>
        <div class="form-group">
          <label for="description">Description:</label>
          <textarea v-model="newModule.description" required class="form-control"></textarea>
        </div>
        <div class="form-group">
          <label for="id">ID:</label>
          <input type="text" v-model="newModule.id" @blur="checkUniqueId" required class="form-control" />
          <span v-if="!isUniqueId" class="error-message">ID must be unique</span>
        </div>
        <div class="form-group">
          <label for="approxLength">Approximate Length:</label>
          <div class="length-inputs">
            <input type="number" v-model.number="hours" min="0" placeholder="Hours" class="form-control" />
            <label class="length-label">Hours</label>
            <input type="number" v-model.number="minutes" min="0" max="59" placeholder="Minutes" class="form-control" />
            <label class="length-label">Minutes</label>
          </div>
        </div>
        <div class="form-group">
          <label for="difficultyRating">Difficulty Rating:</label>
          <input type="number" v-model="newModule.difficultyRating" required min="1" max="3" class="form-control" />
        </div>
        <div class="form-group">
          <label for="audienceType">Audience Type:</label>
          <select v-model="selectedAudienceType" @change="updateTargets" class="form-control">
            <option v-for="audienceType in audienceTypes" :key="audienceType" :value="audienceType">{{ audienceType }}</option>
            <option value="custom">New/Custom</option>
          </select>
          <input v-if="selectedAudienceType === 'custom'" type="text" v-model="newAudienceType" @blur="convertToCamelCase('newAudienceType')" placeholder="Enter new audience type" class="form-control custom-input" />
        </div>
        <div class="form-group" v-if="selectedAudienceType">
          <label for="target">Target Audience:</label>
          <select v-model="selectedTarget" @change="updateSections" class="form-control">
            <option v-for="target in filteredTargets" :key="target" :value="target">{{ target }}</option>
            <option value="custom">New/Custom</option>
          </select>
          <input v-if="selectedTarget === 'custom'" type="text" v-model="newTarget" @blur="convertToCamelCase('newTarget')" placeholder="Enter new target audience" class="form-control custom-input" />
        </div>
        <div class="form-group" v-if="selectedTarget">
          <label for="section">Section:</label>
          <select v-model="selectedSection" @change="updateSubSections" class="form-control">
            <option v-for="section in filteredSections" :key="section" :value="section">{{ section }}</option>
            <option value="custom">New/Custom</option>
          </select>
          <input v-if="selectedSection === 'custom'" type="text" v-model="newSection" @blur="convertToCamelCase('newSection')" placeholder="Enter new section" class="form-control custom-input" />
        </div>
        <div class="form-group" v-if="selectedSection">
          <label for="subSection">Sub-Section:</label>
          <select v-model="selectedSubSection" class="form-control">
            <option v-for="subSection in filteredSubSections" :key="subSection" :value="subSection">{{ subSection }}</option>
            <option value="custom">New/Custom</option>
          </select>
          <input v-if="selectedSubSection === 'custom'" type="text" v-model="newSubSection" @blur="convertToCamelCase('newSubSection')" placeholder="Enter new sub-section" class="form-control custom-input" />
        </div>

        <div v-if="newModule.type === 'video'">
          <h3>Videos</h3>
          <div v-for="(video, index) in newModule.videos" :key="index">
            <label>Title:</label>
            <input type="text" v-model="video.title" required />
            <label>URL:</label>
            <input type="text" v-model="video.url" required />
            <button type="button" @click="removeVideo(index)">Remove Video</button>
          </div>
          <button type="button" @click="addVideo">Add Video</button>
        </div>

        <div v-if="newModule.type === 'quiz'" class="quiz-builder">
          <h3>Quiz Questions</h3>
          <div v-for="(question, qIndex) in newModule.quiz" :key="qIndex" class="quiz-question">
            <label>Question:</label>
            <input type="text" v-model="question.question" required class="form-control" />
            <label>Options:</label>
            <div class="quiz-options-builder">
              <div v-for="(option, oIndex) in question.options" :key="oIndex" class="quiz-option-builder">
                <input type="text" v-model="question.options[oIndex]" required class="form-control" />
                <button type="button" @click="removeOption(qIndex, oIndex)" class="remove-option-button button">Remove Option</button>
              </div>
            </div>
            <button type="button" @click="addOption(qIndex)" class="add-option-button button">Add Option</button>
            <label>Correct Option:</label>
            <input type="number" v-model="question.correctOption" required min="0" :max="question.options.length - 1" class="form-control" />
            <button type="button" @click="removeQuestion(qIndex)" class="remove-question-button button">Remove Question</button>
          </div>
          <button type="button" @click="addQuestion" class="add-question-button button">Add Question</button>
        </div>

        <div v-if="newModule.type === 'slideshow'">
          <h3>Slideshow</h3>
          <div v-for="(slide, index) in newModule.slideshow" :key="index">
            <label>Description:</label>
            <textarea v-model="slide.description" required></textarea>
            <label>Upload Image:</label>
            <input type="file" @change="handleImageUpload($event, slide)" accept="image/*" required />
            <label>Image URL:</label>
            <input type="text" v-model="slide.url" readonly />
            <button type="button" @click="removeSlide(index)">Remove Slide</button>
            <div v-if="slide.url">
              <h4>Preview:</h4>
              <img :src="slide.url" alt="Slide Image" width="100%" />
            </div>
          </div>
          <button type="button" @click="addSlide">Add Slide</button>
        </div>

        <div v-if="newModule.type === 'pdf-guide'">
          <h3>PDF Guide</h3>
          <div v-for="(guide, index) in newModule.pdfGuides" :key="index">
            <label>Title:</label>
            <input type="text" v-model="guide.title" required />
            <label>Upload PDF:</label>
            <input type="file" @change="handlePdfUpload($event, guide)" accept="application/pdf" required />
            <label>PDF URL:</label>
            <input type="text" v-model="guide.url" readonly />
            <label>Description:</label>
            <textarea v-model="guide.description" required></textarea>
            <button type="button" @click="removePdfGuide(index)">Remove PDF Guide</button>
            <div v-if="guide.url">
              <h4>Preview:</h4>
              <iframe :src="guide.url" width="100%" height="400" frameborder="0"></iframe>
            </div>
          </div>
          <button type="button" @click="addPdfGuide">Add PDF Guide</button>
        </div>

        <div v-if="newModule.type === 'embedded-guide'">
          <h3>Embedded Guide</h3>
          <div v-for="(guide, index) in newModule.embeddedGuides" :key="index">
            <label>Embed Code:</label>
            <textarea v-model="guide.embedCode" required placeholder="Paste the embed code here"></textarea>
            <label>Title:</label>
            <input type="text" v-model="guide.title" required />
            <label>Description:</label>
            <textarea v-model="guide.description" required></textarea>
            <button type="button" @click="removeEmbeddedGuide(index)">Remove Embedded Guide</button>
            <div v-if="guide.embedCode">
              <h4>Preview:</h4>
              <div v-html="guide.embedCode"></div>
            </div>
          </div>
          <button type="button" @click="addEmbeddedGuide">Add Embedded Guide</button>
        </div>

        <div v-if="newModule.type === 'simulation'">
          <h3>Simulation</h3>
          <div v-for="(step, index) in newModule.simulation" :key="index">
            <label>Description:</label>
            <textarea v-model="step.description" required></textarea>
            <label>Upload Image:</label>
            <input type="file" @change="handleImageUpload($event, step)" accept="image/*" required />
            <label>Image URL:</label>
            <input type="text" v-model="step.url" readonly />
            <label>Click Area Coordinates:</label>
            <input type="text" v-model="step.coordinates" readonly />
            <button type="button" @click="removeSimulationStep(index)">Remove Step</button>
            <div v-if="step.url">
              <h4>Preview:</h4>
              <img :src="step.url" alt="Simulation Image" width="100%" @click="setCoordinates($event, step)" />
            </div>
          </div>
          <button type="button" @click="addSimulationStep">Add Step</button>
        </div>

        <button type="submit" :disabled="!isUniqueId" class="submit-button button">Add Module</button>
      </form>
    </div>
  `,
  data() {
    return {
      newModule: {
        type: '',
        name: '',
        description: '',
        id: '',
        approxLength: '',
        difficultyRating: 1,
        audienceType: '',
        target: '',
        section: '',
        subSection: '',
        videos: [],
        quiz: [],
        slideshow: [],
        pdfGuides: [],
        embeddedGuides: [],
        simulation: []
      },
      allUnits: [],
      isUniqueId: true,
      clickCount: 0,
      tempCoordinates: [],
      hours: 0,
      minutes: 0,
      selectedAudienceType: '',
      newAudienceType: '',
      selectedTarget: '',
      newTarget: '',
      selectedSection: '',
      newSection: '',
      selectedSubSection: '',
      newSubSection: '',
      audienceTypes: [],
      targets: [],
      sections: [],
      subSections: []
    };
  },
  computed: {
    filteredTargets() {
      return this.allUnits
        .filter(unit => unit.audienceType === this.selectedAudienceType)
        .map(unit => unit.target)
        .filter((value, index, self) => self.indexOf(value) === index);
    },
    filteredSections() {
      return this.allUnits
        .filter(unit => unit.audienceType === this.selectedAudienceType && unit.target === this.selectedTarget)
        .map(unit => unit.section)
        .filter((value, index, self) => self.indexOf(value) === index);
    },
    filteredSubSections() {
      return this.allUnits
        .filter(unit => unit.audienceType === this.selectedAudienceType && unit.target === this.selectedTarget && unit.section === this.selectedSection)
        .map(unit => unit.subSection)
        .filter((value, index, self) => self.indexOf(value) === index);
    }
  },
  methods: {
    async fetchAllUnits() {
      try {
        const response = await fetch('PHP/get_training_units.php');
        const data = await response.json();
        if (data.units) {
          this.allUnits = data.units;
          this.updateAudienceTypes();
        } else {
          console.warn('No training units found in the response.');
        }
      } catch (err) {
        console.error('Error loading training units:', err);
      }
    },
    checkUniqueId() {
      const newIdLower = this.newModule.id.toLowerCase();
      this.isUniqueId = !this.allUnits.some(unit => unit.id.toLowerCase() === newIdLower);
    },
    addVideo() {
      this.newModule.videos.push({ title: '', url: '' });
    },
    removeVideo(index) {
      this.newModule.videos.splice(index, 1);
    },
    addQuestion() {
      this.newModule.quiz.push({
        question: '',
        options: ['', ''],
        correctOption: 0
      });
    },
    removeQuestion(qIndex) {
      this.newModule.quiz.splice(qIndex, 1);
    },
    addOption(qIndex) {
      this.newModule.quiz[qIndex].options.push('');
    },
    removeOption(qIndex, oIndex) {
      this.newModule.quiz[qIndex].options.splice(oIndex, 1);
    },
    addSlide() {
      this.newModule.slideshow.push({ url: '', description: '' });
    },
    removeSlide(index) {
      this.newModule.slideshow.splice(index, 1);
    },
    addPdfGuide() {
      this.newModule.pdfGuides.push({ title: '', url: '', description: '' });
    },
    removePdfGuide(index) {
      this.newModule.pdfGuides.splice(index, 1);
    },
    addEmbeddedGuide() {
      this.newModule.embeddedGuides.push({ embedCode: '', title: '', description: '' });
    },
    removeEmbeddedGuide(index) {
      this.newModule.embeddedGuides.splice(index, 1);
    },
    addSimulationStep() {
      this.newModule.simulation.push({ url: '', coordinates: '', description: '' });
    },
    removeSimulationStep(index) {
      this.newModule.simulation.splice(index, 1);
      this.tempCoordinates = []; // Reset temporary coordinates when removing a step
      this.clickCount = 0; // Reset click count
    },
    async handlePdfUpload(event, guide) {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('pdf', file);

        try {
          const response = await fetch('PHP/upload_pdf.php', {
            method: 'POST',
            body: formData
          });
          const result = await response.json();
          if (result.success) {
            guide.url = `media/${result.fileName}`;
            // Calculate the number of pages in the PDF
            const loadingTask = pdfjsLib.getDocument(guide.url);
            const pdf = await loadingTask.promise;
            guide.pdfLength = pdf.numPages; // Set the length as a property of the guide
          } else {
            console.error('Error uploading PDF:', result.message);
          }
        } catch (err) {
          console.error('Error uploading PDF:', err);
        }
      }
    },
    async handleImageUpload(event, item) {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
          const response = await fetch('PHP/upload_image.php', {
            method: 'POST',
            body: formData
          });
          const result = await response.json();
          if (result.success) {
            item.url = `media/${result.fileName}`;
          } else {
            console.error('Error uploading image:', result.message);
          }
        } catch (err) {
          console.error('Error uploading image:', err);
        }
      }
    },
    setCoordinates(event, step) {
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (this.clickCount === 0) {
        this.tempCoordinates = [x, y];
        this.clickCount++;
      } else if (this.clickCount === 1) {
        const coordinates = `${this.tempCoordinates[0]},${this.tempCoordinates[1]},${x},${y}`;
        step.coordinates = coordinates;
        this.tempCoordinates = [];
        this.clickCount = 0;
      }
    },
    async addModule() {
      this.newModule.audienceType = this.selectedAudienceType === 'custom' ? this.newAudienceType : this.selectedAudienceType;
      this.newModule.target = this.selectedTarget === 'custom' ? this.newTarget : this.selectedTarget;
      this.newModule.section = this.selectedSection === 'custom' ? this.newSection : this.selectedSection;
      this.newModule.subSection = this.selectedSubSection === 'custom' ? this.newSubSection : this.selectedSubSection;
      this.newModule.approxLength = `${this.hours}h ${this.minutes}m`;

      try {
        const response = await fetch('PHP/add_module.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.newModule)
        });
        const result = await response.json();
        if (result.success) {
          alert('Module added successfully');
          this.resetForm();
        } else {
          console.error('Error adding module:', result.message);
        }
      } catch (err) {
        console.error('Error adding module:', err);
      }
    },
    resetForm() {
      this.newModule = {
        type: '',
        name: '',
        description: '',
        id: '',
        approxLength: '',
        difficultyRating: 1,
        audienceType: '',
        target: '',
        section: '',
        subSection: '',
        videos: [],
        quiz: [],
        slideshow: [],
        pdfGuides: [],
        embeddedGuides: [],
        simulation: []
      };
      this.isUniqueId = true;
      this.tempCoordinates = []; // Reset temporary coordinates
      this.clickCount = 0; // Reset click count
      this.selectedAudienceType = '';
      this.newAudienceType = '';
      this.selectedTarget = '';
      this.newTarget = '';
      this.selectedSection = '';
      this.newSection = '';
      this.selectedSubSection = '';
      this.newSubSection = '';
      this.hours = 0;
      this.minutes = 0;
      this.updateAudienceTypes();
    },
    convertToCamelCase(property) {
      this[property] = this[property]
        .split(' ')
        .map((word, index) =>
          index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('');
    },
    updateAudienceTypes() {
      const types = new Set();
      const targets = new Set();
      const sections = new Set();
      const subSections = new Set();

      this.allUnits.forEach(unit => {
        if (unit.audienceType) {
          types.add(unit.audienceType);
        }
        if (unit.target) {
          targets.add(unit.target);
        }
        if (unit.section) {
          sections.add(unit.section);
        }
        if (unit.subSection) {
          subSections.add(unit.subSection);
        }
      });

      this.audienceTypes = Array.from(types);
      this.targets = Array.from(targets);
      this.sections = Array.from(sections);
      this.subSections = Array.from(subSections);
    },
    updateTargets() {
      this.targets = Array.from(
        new Set(this.allUnits.filter(unit => unit.audienceType === this.selectedAudienceType).map(unit => unit.target))
      );
      if (!this.targets.includes(this.selectedTarget)) {
        this.selectedTarget = '';
      }
      this.sections = [];
      this.subSections = [];
    },
    updateSections() {
      this.sections = Array.from(
        new Set(
          this.allUnits
            .filter(
              unit =>
                unit.audienceType === this.selectedAudienceType &&
                unit.target === this.selectedTarget
            )
            .map(unit => unit.section)
        )
      );
      if (!this.sections.includes(this.selectedSection)) {
        this.selectedSection = '';
      }
      this.subSections = [];
    },
    updateSubSections() {
      this.subSections = Array.from(
        new Set(
          this.allUnits
            .filter(
              unit =>
                unit.audienceType === this.selectedAudienceType &&
                unit.target === this.selectedTarget &&
                unit.section === this.selectedSection
            )
            .map(unit => unit.subSection)
        )
      );
      if (!this.subSections.includes(this.selectedSubSection)) {
        this.selectedSubSection = '';
      }
    }
  },
  created() {
    this.fetchAllUnits();
  }
};

const ClickTracker = {
  template: `
    <div class="content">
      <h2>Click Tracker</h2>
      <p>This graph tracks clicks over time, while anywhere on the site!</p>
      <canvas id="clickChart"></canvas>
    </div>
  `,
  data() {
    return {
      chart: null
    };
  },
  methods: {
    initializeGraph() {
      const ctx = document.getElementById('clickChart').getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.$root.clicks.map(item => `${new Date(item.interval * this.$root.interval * 1000).toLocaleTimeString()}`),
          datasets: [{
            label: 'Clicks per ' + this.$root.interval + ' seconds',
            data: this.$root.clicks.map(item => item.count),
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4  // This creates the smooth curve effect
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          },
          elements: {
            line: {
              tension: 0.4 // Smooth curves
            }
          }
        }
      });
    },
    updateGraph() {
      this.chart.data.labels = this.$root.clicks.map(item => `${new Date(item.interval * this.$root.interval * 1000).toLocaleTimeString()}`);
      this.chart.data.datasets.forEach((dataset) => {
        dataset.data = this.$root.clicks.map(item => item.count);
      });
      this.chart.update();
    }
  },
  mounted() {
    this.initializeGraph();
    this.$root.$on('update-graph', this.updateGraph);
  },
  beforeDestroy() {
    this.$root.$off('update-graph', this.updateGraph);
  }
}; 
  
const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', redirect: '/training-modules'},
    { path: '/contact', component: ContactView },
    { path: '/booking', component: BookingPage },
    { path: '/training-modules', component: TrainingModulesPage },
    { path: '/leaderboard', component: LeaderboardPage },
    { path: '/user-information', component: UserInformationPage },
    { path: '/user-management', component: ManageUsersPage },
    { path: '/module-builder', component: ModuleBuilder },
    { path: '/click-tracker', component: ClickTracker },
  ],
});

new Vue({
  el: '#app',
  router,
  template: `
    <div class="main-container">
      <div class="header">
          <img src="media/KudosSimplyDoingMoreLogo.png" alt="Kudos Logo" class="logo">
          <h1></h1>
          <div class="user-info">
              <!-- <p>{{ currentUserDetails ? 'Currently logged in as: ' + currentUserDetails.name : 'Not logged in' }}</p> -->
              <button @click="showLoginModal">{{ currentUserDetails ? currentUserDetails.name : 'Login' }}</button>
          </div>
      </div>
      <nav>
        <router-link class="router-link" to="/contact">Contact Support</router-link>
        <router-link class="router-link" to="/booking">Booking Training</router-link>
        <router-link class="router-link" to="/training-modules">Training Modules</router-link>
        <router-link class="router-link" to="/leaderboard">Leaderboard</router-link>
        <router-link class="router-link" to="/user-information">User Information</router-link>
        <router-link class="router-link" to="/user-management">User Management</router-link>
        <router-link class="router-link" to="/module-builder">Module Builder</router-link>
      </nav>
      <router-view></router-view>

      <div v-if="loginModalVisible" class="modal-overlay">
        <div class="modal-content">
          <h2>Login</h2>
          <select v-model="selectedUser">
            <option value="" disabled>Select a user</option>
            <option v-for="user in users" :key="user" :value="user">{{ user }}</option>
          </select>
          <input type="password" placeholder="Password Disabled For Testing" disabled>
          <button @click="fetchUserDetails">Login</button>
          <button @click="hideLoginModal">Cancel</button>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      users: [],
      selectedUser: '',
      currentUserDetails: null,
      loginModalVisible: false,
    };
  },
  methods: {
    async fetchUsers() {
      try {
        const response = await fetch('PHP/get_users.php');
        const data = await response.json();
  
        if (!data.error) {
          this.users = data;
        } else {
          console.error('Error loading users:', data.error);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    },
    async fetchUserDetails() {
      if (!this.selectedUser) return;
  
      try {
        const response = await fetch(`PHP/get_user_details.php?name=${encodeURIComponent(this.selectedUser)}`);
        const data = await response.json();
        if (!data.error) {
          if (data.locked === 'false') {
            this.currentUserDetails = data;
            this.$root.$emit('user-updated', data);
            this.hideLoginModal();
          } else {
            alert('User is locked!');
          }
        } else {
          console.error('Error loading user details:', data.error);
        }
      } catch (err) {
        console.error('Error fetching user details:', err);
      }
    },
    showLoginModal() {
      this.loginModalVisible = true;
    },
    hideLoginModal() {
      this.loginModalVisible = false;
    },
  },
  created() {
    this.fetchUsers();
    this.$root.$on('user-updated', this.fetchUsers);
    // this.$root.$on('user-updated', this.fetchUserDetails);
  },
  beforeDestroy() {
    // this.$root.$off('user-updated', this.fetchUserDetails);
    this.$root.$off('user-updated', this.fetchUsers);
  }
});

    // this.initializeClicks();
    // document.addEventListener('click', this.registerGlobalClick);
    // this.updateClicksPeriodically();
    // document.removeEventListener('click', this.registerGlobalClick);
/* <router-link class="router-link" to="/click-tracker">Click Tracker</router-link> */

  //   registerGlobalClick() {
  //     const currentInterval = Math.floor(Date.now() / (this.interval * 1000));
  
  //     if (this.lastInterval !== currentInterval) {
  //       this.addInterval(currentInterval);
  //     } else if (!this.clicks.length || this.clicks[this.clicks.length - 1].interval !== currentInterval) {
  //       this.clicks.push({ interval: currentInterval, count: 1 });
  //     } else {
  //       this.clicks[this.clicks.length - 1].count++;
  //     }
  //     this.$emit('update-graph');
  //   },
  //   initializeClicks() {
  //     const now = Date.now();
  //     const currentInterval = Math.floor(now / (this.interval * 1000));
  //     this.lastInterval = currentInterval - this.maxEntries;
  //     for (let i = 0; i < this.maxEntries; i++) {
  //       this.clicks.push({ interval: this.lastInterval + i, count: 0 });
  //     }
  //   },
  //   addInterval(currentInterval) {
  //     if (this.lastInterval !== null) {
  //       // Add all missing intervals with 0 clicks
  //       for (let i = this.lastInterval + 1; i <= currentInterval; i++) {
  //         this.clicks.push({ interval: i, count: 0 });
  //         if (this.clicks.length > this.maxEntries) {
  //           this.clicks.shift();
  //         }
  //       }
  //     }
  //     this.lastInterval = currentInterval;
  //   },
  //   updateClicksPeriodically() {
  //     const intervalUpdate = () => {
  //       const currentInterval = Math.floor(Date.now() / (this.interval * 1000));
  //       if (this.lastInterval !== currentInterval) {
  //         this.addInterval(currentInterval);
  //         this.$emit('update-graph');
  //       }
  //     };
  //     setInterval(intervalUpdate, this.interval * 1000);
  //   }