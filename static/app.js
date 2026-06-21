document.addEventListener('DOMContentLoaded', () => {
    // Input elements
    const inputName = document.getElementById('input-name');
    const inputTitle = document.getElementById('input-title');
    const inputBio = document.getElementById('input-bio');
    const inputAvatar = document.getElementById('input-avatar');
    const inputSkills = document.getElementById('input-skills');
    const themeRadios = document.getElementsByName('theme-radio');
    const profileForm = document.getElementById('profile-form');
    const submitBtn = document.getElementById('submit-btn');

    // Live preview elements
    const liveCard = document.getElementById('live-card');
    const cardName = document.getElementById('card-name');
    const cardTitle = document.getElementById('card-title');
    const cardBio = document.getElementById('card-bio');
    const cardAvatar = document.getElementById('card-avatar');
    const cardAvatarFallback = document.getElementById('card-avatar-fallback');
    const cardSkills = document.getElementById('card-skills');

    // History elements
    const historyGrid = document.getElementById('history-grid');

    let historyData = [];

    // Setup input listeners for real-time binding
    inputName.addEventListener('input', updateCardName);
    inputTitle.addEventListener('input', updateCardTitle);
    inputBio.addEventListener('input', updateCardBio);
    inputAvatar.addEventListener('input', updateCardAvatar);
    inputSkills.addEventListener('input', updateCardSkills);

    themeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateCardTheme(e.target.value);
        });
    });

    // Get initials for avatar fallback
    function getInitials(name) {
        if (!name) return 'RS';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    // Live updates
    function updateCardName() {
        const value = inputName.value.trim();
        cardName.textContent = value || 'Your Name';
        cardAvatarFallback.textContent = getInitials(value);
    }

    function updateCardTitle() {
        cardTitle.textContent = inputTitle.value.trim() || 'Professional Title';
    }

    function updateCardBio() {
        cardBio.textContent = inputBio.value.trim() || 'Your story will appear here. Start typing in the form to see your card update live in real-time!';
    }

    function updateCardAvatar() {
        const url = inputAvatar.value.trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            cardAvatar.src = url;
            cardAvatar.classList.remove('hidden');
            cardAvatarFallback.classList.add('hidden');
            
            cardAvatar.onerror = () => {
                // If image fails to load, fallback to initials
                cardAvatar.classList.add('hidden');
                cardAvatarFallback.classList.remove('hidden');
            };
        } else {
            cardAvatar.classList.add('hidden');
            cardAvatarFallback.classList.remove('hidden');
        }
    }

    function updateCardSkills() {
        const skillsText = inputSkills.value.trim();
        cardSkills.innerHTML = '';
        
        if (!skillsText) {
            // Default skills if empty
            ['HTML5', 'CSS3', 'JavaScript'].forEach(s => {
                const badge = document.createElement('span');
                badge.className = 'skill-badge';
                badge.textContent = s;
                cardSkills.appendChild(badge);
            });
            return;
        }

        const skillsArray = skillsText.split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        skillsArray.forEach(skill => {
            const badge = document.createElement('span');
            badge.className = 'skill-badge';
            badge.textContent = skill;
            cardSkills.appendChild(badge);
        });
    }

    function updateCardTheme(themeName) {
        // Remove old theme classes
        liveCard.className = 'profile-card';
        liveCard.classList.add(`theme-${themeName}`);
        
        // Add animation pop effect
        liveCard.classList.remove('animate-pop');
        void liveCard.offsetWidth; // Trigger reflow
        liveCard.classList.add('animate-pop');
    }

    // Submit form to API
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = inputName.value.trim();
        const title = inputTitle.value.trim();
        const bio = inputBio.value.trim();
        const avatar = inputAvatar.value.trim();
        const skills = inputSkills.value.trim();
        
        let theme = 'glass';
        themeRadios.forEach(radio => {
            if (radio.checked) theme = radio.value;
        });

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    job_title: title,
                    bio: bio,
                    avatar_url: avatar,
                    skills: skills,
                    theme: theme
                })
            });

            if (!response.ok) throw new Error('Failed to save profile');

            const result = await response.json();
            
            // Reload registry history
            fetchHistory();
            
            // Reset form
            profileForm.reset();
            
            // Reset theme picker
            themeRadios[0].checked = true;
            
            // Reset live card preview to defaults
            cardName.textContent = 'Your Name';
            cardTitle.textContent = 'Professional Title';
            cardBio.textContent = 'Your story will appear here. Start typing in the form to see your card update live in real-time!';
            cardAvatar.classList.add('hidden');
            cardAvatarFallback.classList.remove('hidden');
            cardAvatarFallback.textContent = 'RS';
            updateCardSkills();
            updateCardTheme('glass');
            
            alert('Profile saved to registry successfully!');

        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Error saving profile. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Save to Studio History';
        }
    });

    // Fetch and load registry history
    async function fetchHistory() {
        try {
            const response = await fetch('/api/profiles');
            if (!response.ok) throw new Error('Failed to fetch history');
            
            historyData = await response.json();
            renderHistory(historyData);
        } catch (error) {
            console.error('Error fetching history:', error);
            historyGrid.innerHTML = `
                <div class="loading-history">
                    <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>
                    <p>Failed to load profile history.</p>
                </div>
            `;
        }
    }

    // Render history grid items
    function renderHistory(profiles) {
        historyGrid.innerHTML = '';
        
        if (profiles.length === 0) {
            historyGrid.innerHTML = `
                <div class="loading-history">
                    <i class="fa-regular fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <p>No profile cards saved in this studio yet.</p>
                </div>
            `;
            return;
        }

        profiles.forEach(profile => {
            const item = document.createElement('div');
            item.className = 'history-card-item';
            
            // Initials or Avatar
            let avatarHTML = '';
            if (profile.avatar_url && (profile.avatar_url.startsWith('http://') || profile.avatar_url.startsWith('https://'))) {
                avatarHTML = `<img src="${escapeHTML(profile.avatar_url)}" alt="Avatar" class="history-avatar" onerror="this.outerHTML='<div class=&quot;history-fallback&quot;>${getInitials(profile.name)}</div>'">`;
            } else {
                avatarHTML = `<div class="history-fallback">${getInitials(profile.name)}</div>`;
            }

            item.innerHTML = `
                ${avatarHTML}
                <div class="history-details">
                    <div class="history-name">${escapeHTML(profile.name)}</div>
                    <div class="history-title">${escapeHTML(profile.job_title)}</div>
                    <span class="history-theme-tag">${escapeHTML(profile.theme)}</span>
                </div>
            `;

            // Clicking a history card loads it back into preview for editing/inspection!
            item.addEventListener('click', () => {
                loadProfileIntoFormAndPreview(profile);
            });

            historyGrid.appendChild(item);
        });
    }

    // Load profile data into form and preview card
    function loadProfileIntoFormAndPreview(profile) {
        inputName.value = profile.name;
        inputTitle.value = profile.job_title;
        inputBio.value = profile.bio;
        inputAvatar.value = profile.avatar_url;
        inputSkills.value = profile.skills;
        
        // Select matching radio
        themeRadios.forEach(radio => {
            if (radio.value === profile.theme) {
                radio.checked = true;
            }
        });

        // Trigger updates
        updateCardName();
        updateCardTitle();
        updateCardBio();
        updateCardAvatar();
        updateCardSkills();
        updateCardTheme(profile.theme);
        
        // Scroll to form configuration top
        document.querySelector('.workspace').scrollIntoView({ behavior: 'smooth' });
    }

    // Escape HTML strings
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Initial load
    updateCardSkills();
    fetchHistory();
});
