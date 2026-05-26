// Mobile Phone Web Simulator logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. Status Bar Clock Update
    function updateClock() {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('simTime').textContent = `${hrs}:${mins}`;
    }
    updateClock();
    setInterval(updateClock, 10000); // update clock every 10 seconds

    // 2. Parse Session ID
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');

    if (!sessionId) {
        alert('No Session ID found in link. Kiosk sync will not work. Please scan the QR code from the ATM kiosk screen.');
    }

    // DOM Elements
    const profilesList = document.getElementById('profilesList');
    const syncOverlay = document.getElementById('syncOverlay');
    const successScreen = document.getElementById('successScreen');
    const dismissSuccessBtn = document.getElementById('dismissSuccessBtn');

    // 3. Fetch User Profiles (Representing AWS database)
    async function loadProfiles() {
        try {
            const res = await fetch('/api/users');
            const users = await res.json();

            profilesList.innerHTML = '';
            users.forEach(user => {
                const card = document.createElement('div');
                card.className = 'user-card-mobile';
                card.innerHTML = `
                    <div class="card-left">
                        <img src="${user.avatar}" class="card-avatar" alt="Avatar">
                        <div class="card-info">
                            <h4>${user.name}</h4>
                            <p>${user.id} | ${user.tier}</p>
                        </div>
                    </div>
                    <div class="card-action-icon">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                `;

                // Handle tap/click on user card
                card.addEventListener('click', () => {
                    linkProfileToKiosk(user.id);
                });

                profilesList.appendChild(card);
            });
        } catch (err) {
            console.error('Error loading profiles:', err);
            profilesList.innerHTML = `
                <div class="loading-state" style="color: #ef4444;">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>Failed to retrieve profiles from AWS database.</p>
                </div>
            `;
        }
    }

    // 4. Send Connect API request
    async function linkProfileToKiosk(userId) {
        if (!sessionId) {
            alert('Cannot link profile: Missing ATM Session ID in URL.');
            return;
        }

        // Show loading sync screen
        syncOverlay.classList.add('active');

        // Simulate network latency (sync delay)
        setTimeout(async () => {
            try {
                const res = await fetch('/api/connect-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: sessionId,
                        userId: userId
                    })
                });

                const data = await res.json();
                syncOverlay.classList.remove('active');

                if (data.success) {
                    // Show success screen
                    successScreen.classList.add('active');
                } else {
                    alert(`Sync failed: ${data.error || 'Unknown error'}`);
                }
            } catch (err) {
                console.error('Error linking session:', err);
                syncOverlay.classList.remove('active');
                alert('Connection to server failed. Please try again.');
            }
        }, 1200);
    }

    // Done button click
    dismissSuccessBtn.addEventListener('click', () => {
        successScreen.classList.remove('active');
    });

    // Bootstrapping
    loadProfiles();
});
