function scrollGrid(direction) {
    const grid = document.getElementById('concerns-grid');
    const scrollAmount = 170; // Width of one card (150px) + gap (20px)
    if (direction === 'left') {
        grid.scrollLeft -= scrollAmount;
    } else {
        grid.scrollLeft += scrollAmount;
    }
}

function showForm(formType) {
    // Toggle form visibility
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById(formType + '-form').classList.add('active');

    // Toggle button active state
    document.getElementById('login-toggle').classList.remove('active');
    document.getElementById('signup-toggle').classList.remove('active');
    document.getElementById(formType + '-toggle').classList.add('active');
}


document.addEventListener('DOMContentLoaded', () => {
    const medicationForm = document.getElementById('medicationForm');
    const tabletsPerDayInput = document.getElementById('tabletsPerDay');
    const timeInputsContainer = document.getElementById('timeInputs');
    const medicationList = document.getElementById('medicationList');
    const noMedications = document.getElementById('noMedications');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const confirmationButtons = document.getElementById('confirmationButtons');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');
    const addMoreOptions = document.getElementById('addMoreOptions');
    const addAnotherButton = document.getElementById('addAnother');
    const clearFormButton = document.getElementById('clearForm');
    let medications = JSON.parse(localStorage.getItem('medications')) || [];
    let notificationCount = {};
    let activeReminders = {};

    // Update time input fields dynamically
    tabletsPerDayInput.addEventListener('input', () => {
        const tabletsPerDay = parseInt(tabletsPerDayInput.value) || 0;
        timeInputsContainer.innerHTML = '';
        for (let i = 0; i < tabletsPerDay; i++) {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label for="timeToTake${i}">Time for Dose ${i + 1} (HH:MM)</label>
                <input type="time" id="timeToTake${i}" required>
                <small>Specify the time for dose ${i + 1} of the day.</small>
            `;
            timeInputsContainer.appendChild(div);
        }
    });

    // Load existing medications
    renderMedications();

    // Form submission
    medicationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const medName = document.getElementById('medName').value;
        const tabletsPerDay = parseInt(document.getElementById('tabletsPerDay').value);
        const totalTablets = parseInt(document.getElementById('totalTablets').value);
        const priority = document.getElementById('priority').value;
        const timesToTake = [];
        for (let i = 0; i < tabletsPerDay; i++) {
            const timeInput = document.getElementById(`timeToTake${i}`);
            if (timeInput.value) {
                timesToTake.push(timeInput.value);
            }
        }

        if (timesToTake.length !== tabletsPerDay) {
            showNotification('Please provide a time for each dose.', false);
            return;
        }

        const medication = {
            id: Date.now(),
            name: medName,
            tabletsPerDay,
            totalTablets,
            timesToTake,
            priority
        };

        medications.push(medication);
        localStorage.setItem('medications', JSON.stringify(medications));
        renderMedications();
        medicationForm.reset();
        timeInputsContainer.innerHTML = '';
        addMoreOptions.style.display = 'block';
    });

    // Add another medication
    addAnotherButton.addEventListener('click', () => {
        addMoreOptions.style.display = 'none';
        document.getElementById('medName').focus();
    });

    // Clear form and hide options
    clearFormButton.addEventListener('click', () => {
        addMoreOptions.style.display = 'none';
        medicationForm.reset();
        timeInputsContainer.innerHTML = '';
    });

    // Render medications
    function renderMedications() {
        medicationList.innerHTML = '<h3>Your Medications</h3>';
        if (medications.length === 0) {
            noMedications.style.display = 'block';
        } else {
            noMedications.style.display = 'none';
            medications.forEach(med => {
                const item = document.createElement('div');
                item.className = 'medication-item';
                item.innerHTML = `
                    <span>${med.name} - ${med.tabletsPerDay} tablets/day, ${med.totalTablets} left, Times: ${med.timesToTake.join(', ')}, Priority: ${med.priority}</span>
                    <button onclick="deleteMedication(${med.id})">Delete</button>
                `;
                medicationList.appendChild(item);

                // Check for low stock
                if (med.totalTablets <= 5 && !notificationCount[med.id]) {
                    notificationCount[med.id] = med.priority === 'high' ? 3 : 1;
                }
            });
        }

        // Trigger low stock notifications
        Object.keys(notificationCount).forEach(id => {
            const med = medications.find(m => m.id === parseInt(id));
            if (med && notificationCount[id] > 0) {
                showNotification(`Low stock alert: Only ${med.totalTablets} tablets of ${med.name} remaining. Please reorder.`, false);
                notificationCount[id]--;
                if (notificationCount[id] === 0) {
                    delete notificationCount[id];
                }
            }
        });
    }

    // Delete medication
    window.deleteMedication = (id) => {
        medications = medications.filter(med => med.id !== id);
        delete notificationCount[id];
        Object.keys(activeReminders).forEach(key => {
            if (key.startsWith(`${id}-`)) {
                delete activeReminders[key];
            }
        });
        localStorage.setItem('medications', JSON.stringify(medications));
        renderMedications();
    };

    // Show notification
    function showNotification(message, showButtons = false, medId = null, time = null) {
        notificationMessage.textContent = message;
        confirmationButtons.style.display = showButtons ? 'flex' : 'none';
        notification.style.display = 'block';

        if (showButtons) {
            confirmYes.onclick = () => {
                if (medId && time) {
                    const med = medications.find(m => m.id === medId);
                    if (med) {
                        med.totalTablets -= 1;
                        if (med.totalTablets <= 0) {
                            med.totalTablets = 0;
                            showNotification(`Out of ${med.name}! Please reorder.`, false);
                        }
                        if (med.totalTablets <= 5 && !notificationCount[med.id]) {
                            notificationCount[med.id] = med.priority === 'high' ? 3 : 1;
                        }
                        localStorage.setItem('medications', JSON.stringify(medications));
                        renderMedications();
                    }
                    delete activeReminders[`${medId}-${time}`];
                }
                notification.style.display = 'none';
            };
            confirmNo.onclick = () => {
                notification.style.display = 'none';
            };
        } else {
            setTimeout(() => {
                notification.style.display = 'none';
            }, 5000);
        }
    }

    // Check medication times every minute
    setInterval(() => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        medications.forEach(med => {
            med.timesToTake.forEach(time => {
                const [medHour, medMinute] = time.split(':').map(Number);
                const [nowHour, nowMinute] = currentTime.split(':').map(Number);
                const timeDiff = (medHour * 60 + medMinute) - (nowHour * 60 + nowMinute);
                const reminderKey = `${med.id}-${time}`;

                // Check if within 5 minutes before or after the scheduled time
                if (timeDiff >= -5 && timeDiff <= 0) {
                    if (!activeReminders[reminderKey]) {
                        activeReminders[reminderKey] = { lastNotified: null, confirmed: false };
                    }
                    // Only notify if not confirmed and not notified in the last minute
                    if (!activeReminders[reminderKey].confirmed) {
                        const lastNotified = activeReminders[reminderKey].lastNotified;
                        const nowMs = now.getTime();
                        if (!lastNotified || (nowMs - lastNotified >= 60000)) {
                            showNotification(
                                timeDiff >= 0
                                    ? `Time to take 1 tablet of ${med.name}!`
                                    : `Did you take 1 tablet of ${med.name} at ${time}?`,
                                timeDiff < 0,
                                med.id,
                                time
                            );
                            activeReminders[reminderKey].lastNotified = nowMs;
                        }
                    }
                } else if (timeDiff < -5 && activeReminders[reminderKey] && !activeReminders[reminderKey].confirmed) {
                    // Continue post-time notifications if not confirmed
                    const lastNotified = activeReminders[reminderKey].lastNotified;
                    const nowMs = now.getTime();
                    if (!lastNotified || (nowMs - lastNotified >= 60000)) {
                        showNotification(
                            `Did you take 1 tablet of ${med.name} at ${time}?`,
                            true,
                            med.id,
                            time
                        );
                        activeReminders[reminderKey].lastNotified = nowMs;
                    }
                }
            });
        });
    }, 60000); // Check every minute
});