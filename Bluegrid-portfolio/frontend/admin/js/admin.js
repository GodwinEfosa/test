/* ============================================
   BLUE GRID - ADMIN DASHBOARD JAVASCRIPT
   ============================================ */

// ============================================
// AUTHENTICATION CHECK
// ============================================

(function checkAuth() {
  const isAuthenticated = sessionStorage.getItem('bluegrid_admin_auth');
  if (!isAuthenticated) {
    window.location.href = 'index.html';
  }
})();

// ============================================
// DATA MANAGEMENT
// ============================================

const STORAGE_KEY = 'bluegrid_projects';
const LOGO_KEY = 'bluegrid_logo';

function getProjects() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error reading projects:', e);
    return [];
  }
}

function saveProjects(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    localStorage.setItem('bluegrid_last_updated', new Date().toISOString());
    return true;
  } catch (e) {
    console.error('Error saving projects:', e);
    return false;
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================
// UI STATE
// ============================================

let editingProjectId = null;
let deleteProjectId = null;
let pendingLogoData = null;
let pendingBannerData = null;

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
  // Mobile menu
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  mobileMenu: document.getElementById('mobile-menu'),
  mobileMenuClose: document.getElementById('mobile-menu-close'),
  
  // Logo
  logoUpload: document.getElementById('logo-upload'),
  logoDropZone: document.getElementById('logo-drop-zone'),
  logoPreviewImg: document.getElementById('logo-preview-img'),
  logoPlaceholder: document.getElementById('logo-placeholder'),
  saveLogoBtn: document.getElementById('save-logo-btn'),
  clearLogoBtn: document.getElementById('clear-logo-btn'),
  
  // Project form
  addProjectBtn: document.getElementById('add-project-btn'),
  projectFormContainer: document.getElementById('project-form-container'),
  projectForm: document.getElementById('project-form'),
  formTitle: document.getElementById('form-title'),
  projectId: document.getElementById('project-id'),
  projectName: document.getElementById('project-name'),
  projectUrl: document.getElementById('project-url'),
  bannerDropZone: document.getElementById('banner-drop-zone'),
  bannerUpload: document.getElementById('banner-upload'),
  bannerPreview: document.getElementById('banner-preview'),
  bannerPreviewImg: document.getElementById('banner-preview-img'),
  cancelFormBtn: document.getElementById('cancel-form-btn'),
  submitBtnText: document.getElementById('submit-btn-text'),
  
  // Projects list
  projectsList: document.getElementById('projects-list'),
  projectsEmpty: document.getElementById('projects-empty'),
  projectCount: document.getElementById('project-count'),
  lastUpdated: document.getElementById('last-updated'),
  
  // Delete modal
  deleteModal: document.getElementById('delete-modal'),
  cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
  confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
  
  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),
  toastIcon: document.getElementById('toast-icon'),
  
  // Logout
  logoutBtn: document.getElementById('logout-btn')
};

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'success') {
  elements.toastMessage.textContent = message;
  
  if (type === 'error') {
    elements.toastIcon.className = 'fa-solid fa-exclamation-circle text-xl';
    elements.toastIcon.style.color = '#ef4444';
  } else {
    elements.toastIcon.className = 'fa-solid fa-check-circle text-xl';
    elements.toastIcon.style.color = '#22c55e';
  }
  
  elements.toast.classList.add('toast-visible');
  
  setTimeout(() => {
    elements.toast.classList.remove('toast-visible');
  }, 3000);
}

// ============================================
// MOBILE MENU
// ============================================

function initMobileMenu() {
  if (elements.mobileMenuBtn && elements.mobileMenu) {
    elements.mobileMenuBtn.addEventListener('click', () => {
      elements.mobileMenu.classList.remove('hidden');
    });
  }
  
  if (elements.mobileMenuClose && elements.mobileMenu) {
    elements.mobileMenuClose.addEventListener('click', () => {
      elements.mobileMenu.classList.add('hidden');
    });
  }
  
  // Close on nav link click
  document.querySelectorAll('.mobile-nav-item').forEach(link => {
    link.addEventListener('click', () => {
      elements.mobileMenu.classList.add('hidden');
    });
  });
}

// ============================================
// LOGO MANAGEMENT
// ============================================

function initLogoManager() {
  // Load existing logo
  const existingLogo = localStorage.getItem(LOGO_KEY);
  if (existingLogo) {
    elements.logoPreviewImg.src = existingLogo;
    elements.logoPreviewImg.classList.remove('hidden');
    elements.logoPlaceholder.classList.add('hidden');
  }
  
  // Drop zone click
  elements.logoDropZone.addEventListener('click', () => {
    elements.logoUpload.click();
  });
  
  // File selection
  elements.logoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      processLogoFile(file);
    }
  });
  
  // Drag and drop
  elements.logoDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.logoDropZone.style.borderColor = 'var(--color-accent)';
  });
  
  elements.logoDropZone.addEventListener('dragleave', () => {
    elements.logoDropZone.style.borderColor = 'var(--border)';
  });
  
  elements.logoDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.logoDropZone.style.borderColor = 'var(--border)';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processLogoFile(file);
    }
  });
  
  // Save logo
  elements.saveLogoBtn.addEventListener('click', () => {
    if (pendingLogoData) {
      localStorage.setItem(LOGO_KEY, pendingLogoData);
      showToast('Logo saved successfully!');
      pendingLogoData = null;
    } else if (localStorage.getItem(LOGO_KEY)) {
      showToast('Logo already saved!');
    } else {
      showToast('Please select a logo first', 'error');
    }
  });
  
  // Clear logo
  elements.clearLogoBtn.addEventListener('click', () => {
    localStorage.removeItem(LOGO_KEY);
    elements.logoPreviewImg.classList.add('hidden');
    elements.logoPlaceholder.classList.remove('hidden');
    elements.logoUpload.value = '';
    pendingLogoData = null;
    showToast('Logo removed');
  });
}

function processLogoFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    pendingLogoData = e.target.result;
    elements.logoPreviewImg.src = pendingLogoData;
    elements.logoPreviewImg.classList.remove('hidden');
    elements.logoPlaceholder.classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

// ============================================
// PROJECT FORM
// ============================================

function initProjectForm() {
  // Add project button
  elements.addProjectBtn.addEventListener('click', () => {
    editingProjectId = null;
    elements.formTitle.textContent = 'Add New Project';
    elements.submitBtnText.textContent = 'Save Project';
    elements.projectForm.reset();
    elements.projectId.value = '';
    elements.bannerPreview.classList.add('hidden');
    pendingBannerData = null;
    elements.projectFormContainer.classList.remove('hidden');
    elements.projectFormContainer.scrollIntoView({ behavior: 'smooth' });
  });
  
  // Cancel button
  elements.cancelFormBtn.addEventListener('click', () => {
    elements.projectFormContainer.classList.add('hidden');
    editingProjectId = null;
    pendingBannerData = null;
  });
  
  // Banner drop zone
  elements.bannerDropZone.addEventListener('click', () => {
    elements.bannerUpload.click();
  });
  
  elements.bannerUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      processBannerFile(file);
    }
  });
  
  elements.bannerDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.bannerDropZone.style.borderColor = 'var(--color-accent)';
  });
  
  elements.bannerDropZone.addEventListener('dragleave', () => {
    elements.bannerDropZone.style.borderColor = 'var(--border)';
  });
  
  elements.bannerDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.bannerDropZone.style.borderColor = 'var(--border)';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processBannerFile(file);
    }
  });
  
  // Form submit
  elements.projectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveProject();
  });
}

function processBannerFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    pendingBannerData = e.target.result;
    elements.bannerPreviewImg.src = pendingBannerData;
    elements.bannerPreview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function saveProject() {
  const name = elements.projectName.value.trim();
  const url = elements.projectUrl.value.trim();
  
  // Validation
  if (!name || !url) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  // URL validation
  try {
    new URL(url);
  } catch (e) {
    showToast('Please enter a valid URL (including https://)', 'error');
    return;
  }
  
  const projects = getProjects();
  
  if (editingProjectId) {
    // Update existing
    const index = projects.findIndex(p => p.id === editingProjectId);
    if (index !== -1) {
      projects[index] = {
        ...projects[index],
        name,
        url,
        banner: pendingBannerData || projects[index].banner
      };
    }
    showToast('Project updated successfully!');
  } else {
    // Add new
    const newProject = {
      id: generateId(),
      name,
      url,
      banner: pendingBannerData || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop'
    };
    projects.unshift(newProject);
    showToast('Project added successfully!');
  }
  
  saveProjects(projects);
  renderProjects();
  
  // Reset form
  elements.projectFormContainer.classList.add('hidden');
  elements.projectForm.reset();
  elements.bannerPreview.classList.add('hidden');
  editingProjectId = null;
  pendingBannerData = null;
}

function editProject(projectId) {
  const projects = getProjects();
  const project = projects.find(p => p.id === projectId);
  
  if (!project) return;
  
  editingProjectId = projectId;
  elements.formTitle.textContent = 'Edit Project';
  elements.submitBtnText.textContent = 'Update Project';
  
  elements.projectId.value = project.id;
  elements.projectName.value = project.name;
  elements.projectUrl.value = project.url;
  
  if (project.banner) {
    elements.bannerPreviewImg.src = project.banner;
    elements.bannerPreview.classList.remove('hidden');
    pendingBannerData = project.banner;
  }
  
  elements.projectFormContainer.classList.remove('hidden');
  elements.projectFormContainer.scrollIntoView({ behavior: 'smooth' });
}

function deleteProject(projectId) {
  deleteProjectId = projectId;
  elements.deleteModal.classList.remove('hidden');
  elements.deleteModal.classList.add('flex');
}

function confirmDelete() {
  if (!deleteProjectId) return;
  
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== deleteProjectId);
  saveProjects(filtered);
  renderProjects();
  
  elements.deleteModal.classList.add('hidden');
  elements.deleteModal.classList.remove('flex');
  deleteProjectId = null;
  
  showToast('Project deleted');
}

// ============================================
// RENDER PROJECTS
// ============================================

function renderProjects() {
  const projects = getProjects();
  
  // Update count
  elements.projectCount.textContent = projects.length;
  
  // Update last updated
  const lastUpdated = localStorage.getItem('bluegrid_last_updated');
  if (lastUpdated) {
    const date = new Date(lastUpdated);
    elements.lastUpdated.textContent = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Render list
  if (projects.length === 0) {
    elements.projectsList.classList.add('hidden');
    elements.projectsEmpty.classList.remove('hidden');
    return;
  }
  
  elements.projectsList.classList.remove('hidden');
  elements.projectsEmpty.classList.add('hidden');
  
  elements.projectsList.innerHTML = projects.map(project => `
    <div class="project-row" style="border-bottom: 1px solid var(--border);">
      <div class="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0" style="background: var(--color-mid);">
        <img 
          src="${project.banner}" 
          alt="${project.name}" 
          class="w-full h-full object-cover"
          onerror="this.src='https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&h=60&fit=crop'"
        >
      </div>
      <div class="min-w-0">
        <h4 class="font-medium truncate" style="color: var(--fg);">${project.name}</h4>
        <p class="text-xs font-mono truncate" style="color: var(--muted);">${project.url}</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          onclick="editProject('${project.id}')"
          class="p-2 rounded-lg transition-all hover:bg-white/10"
          style="color: var(--color-accent);"
          aria-label="Edit project"
        >
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button 
          onclick="deleteProject('${project.id}')"
          class="p-2 rounded-lg transition-all hover:bg-red-500/10"
          style="color: #ef4444;"
          aria-label="Delete project"
        >
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// ============================================
// DELETE MODAL
// ============================================

function initDeleteModal() {
  elements.cancelDeleteBtn.addEventListener('click', () => {
    elements.deleteModal.classList.add('hidden');
    elements.deleteModal.classList.remove('flex');
    deleteProjectId = null;
  });
  
  elements.confirmDeleteBtn.addEventListener('click', confirmDelete);
  
  // Close on backdrop click
  elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) {
      elements.deleteModal.classList.add('hidden');
      elements.deleteModal.classList.remove('flex');
      deleteProjectId = null;
    }
  });
}

// ============================================
// LOGOUT
// ============================================

function initLogout() {
  const logoutBtns = document.querySelectorAll('#logout-btn, a[href="index.html"]');
  logoutBtns.forEach(btn => {
    if (btn.textContent.includes('Logout')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('bluegrid_admin_auth');
        window.location.href = 'index.html';
      });
    }
  });
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initLogoManager();
  initProjectForm();
  initDeleteModal();
  initLogout();
  renderProjects();
});

// Make functions globally available
window.editProject = editProject;
window.deleteProject = deleteProject;
