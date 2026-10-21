/**
 * NOVA - AI Virtual Concierge Controller
 * Friendly, role-adaptive conversational companion with real-time speech controls.
 */
class AIConcierge {
    constructor() {
        this.window = document.getElementById('conciergeWindow');
        this.floatBtn = document.getElementById('conciergeFloatBtn');
        this.messagesContainer = document.getElementById('conciergeMessages');
        this.chatInput = document.getElementById('conciergeInput');
        this.sendBtn = document.getElementById('conciergeSendBtn');
        this.voiceBtn = document.getElementById('conciergeVoiceBtn');
        
        // Voice Control Elements
        this.muteBtn = document.getElementById('conciergeMuteBtn');
        this.stopVoiceBtn = document.getElementById('conciergeStopVoiceBtn');
        this.speakingBar = document.getElementById('conciergeSpeakingBar');
        this.speakingBarStopBtn = document.getElementById('speakingBarStopBtn');
        this.statusText = document.getElementById('conciergeStatusText');
        this.novaOrb = document.getElementById('novaOrb');

        this.history = [];
        this.isRecording = false;
        this.isSpeaking = false;
        this.activeVoiceBubbleBtn = null;
        this.currentRole = 'guest';

        // Load voice preference from localStorage (defaults to true)
        const savedVoicePref = localStorage.getItem('nova_voice_enabled');
        this.isVoiceEnabled = savedVoicePref === null ? true : savedVoicePref === 'true';

        this.initSpeech();
        this.bindEvents();
        this.updateMuteUI();
        this.updateRoleUI('guest');
    }

    initSpeech() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.stopSpeaking();
                this.isRecording = true;
                if (this.voiceBtn) this.voiceBtn.classList.add('recording');
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (this.chatInput) this.chatInput.value = transcript;
                this.sendMessage(transcript);
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                if (this.voiceBtn) this.voiceBtn.classList.remove('recording');
            };

            this.recognition.onerror = () => {
                this.isRecording = false;
                if (this.voiceBtn) this.voiceBtn.classList.remove('recording');
            };
        }
    }

    stopSpeaking() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        this.isSpeaking = false;
        this.updateVoiceStatusUI(false);
        if (this.activeVoiceBubbleBtn) {
            this.activeVoiceBubbleBtn.classList.remove('active-speaking');
            this.activeVoiceBubbleBtn.innerHTML = `🔊 Read aloud`;
            this.activeVoiceBubbleBtn = null;
        }
    }

    toggleVoiceMute() {
        this.isVoiceEnabled = !this.isVoiceEnabled;
        localStorage.setItem('nova_voice_enabled', this.isVoiceEnabled);
        if (!this.isVoiceEnabled) {
            this.stopSpeaking();
        }
        this.updateMuteUI();
    }

    updateMuteUI() {
        if (!this.muteBtn) return;
        if (this.isVoiceEnabled) {
            this.muteBtn.classList.remove('muted');
            this.muteBtn.title = "Mute NOVA's voice reading";
            this.muteBtn.innerHTML = `
                <svg style="width: 16px; height: 16px; fill: currentColor;" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
            `;
        } else {
            this.muteBtn.classList.add('muted');
            this.muteBtn.title = "Unmute NOVA's voice reading";
            this.muteBtn.innerHTML = `
                <svg style="width: 16px; height: 16px; fill: currentColor;" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
            `;
        }
    }

    updateVoiceStatusUI(isSpeaking) {
        if (this.speakingBar) {
            this.speakingBar.style.display = isSpeaking ? 'flex' : 'none';
        }
        if (this.stopVoiceBtn) {
            this.stopVoiceBtn.style.display = isSpeaking ? 'flex' : 'none';
        }
        if (this.statusText) {
            this.statusText.innerText = isSpeaking ? "NOVA is speaking..." : "Online • Your AI Friend & Concierge";
        }
        if (this.novaOrb) {
            if (isSpeaking) {
                this.novaOrb.style.boxShadow = "0 0 22px var(--accent)";
                this.novaOrb.style.background = "radial-gradient(circle, #fff, var(--accent))";
            } else {
                this.novaOrb.style.boxShadow = "0 0 15px var(--accent-light)";
                this.novaOrb.style.background = "radial-gradient(circle, #fff, var(--accent-light))";
            }
        }
    }

    speak(text, bubbleVoiceBtn = null) {
        if (!('speechSynthesis' in window)) return;
        if (!this.isVoiceEnabled) return;

        this.stopSpeaking();

        // Strip markdown bold/bullets/formatting & clean text for friendly speech
        const cleanText = text
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/[*_#•`]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/₹\s*/g, 'Rupees ')
            .replace(/https?:\/\/\S+/g, '')
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.02;
        utterance.pitch = 1.0;

        // Try to pick a natural friendly English voice
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const naturalVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Female')) && v.lang.startsWith('en'))
                || voices.find(v => v.lang.startsWith('en'));
            if (naturalVoice) utterance.voice = naturalVoice;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateVoiceStatusUI(true);
            if (bubbleVoiceBtn) {
                this.activeVoiceBubbleBtn = bubbleVoiceBtn;
                bubbleVoiceBtn.classList.add('active-speaking');
                bubbleVoiceBtn.innerHTML = `⏹ Stop voice`;
            }
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.updateVoiceStatusUI(false);
            if (bubbleVoiceBtn) {
                bubbleVoiceBtn.classList.remove('active-speaking');
                bubbleVoiceBtn.innerHTML = `🔊 Read aloud`;
            }
        };

        utterance.onerror = () => {
            this.isSpeaking = false;
            this.updateVoiceStatusUI(false);
            if (bubbleVoiceBtn) {
                bubbleVoiceBtn.classList.remove('active-speaking');
                bubbleVoiceBtn.innerHTML = `🔊 Read aloud`;
            }
        };

        window.speechSynthesis.speak(utterance);
    }

    bindEvents() {
        if (this.floatBtn) {
            this.floatBtn.addEventListener('click', () => this.toggle());
        }

        const closeBtn = document.getElementById('conciergeCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.stopSpeaking();
                this.toggle(false);
            });
        }

        if (this.muteBtn) {
            this.muteBtn.addEventListener('click', () => this.toggleVoiceMute());
        }

        if (this.stopVoiceBtn) {
            this.stopVoiceBtn.addEventListener('click', () => this.stopSpeaking());
        }

        if (this.speakingBarStopBtn) {
            this.speakingBarStopBtn.addEventListener('click', () => this.stopSpeaking());
        }

        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => {
                this.stopSpeaking();
                this.handleSend();
            });
        }

        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.stopSpeaking();
                    this.handleSend();
                }
            });
            // Stop voice if user starts typing a new query
            this.chatInput.addEventListener('input', () => {
                if (this.isSpeaking) {
                    this.stopSpeaking();
                }
            });
        }

        if (this.voiceBtn) {
            this.voiceBtn.addEventListener('click', () => {
                this.stopSpeaking();
                if (!this.recognition) {
                    if (window.App && window.App.showToast) {
                        window.App.showToast("Speech recognition is not supported in this browser. Please type your query.", "error");
                    }
                    return;
                }
                if (this.isRecording) {
                    this.recognition.stop();
                } else {
                    this.recognition.start();
                }
            });
        }
    }

    toggle(forceState = null) {
        if (forceState !== null) {
            this.window.classList.toggle('active', forceState);
        } else {
            this.window.classList.toggle('active');
        }
        if (this.window.classList.contains('active')) {
            setTimeout(() => this.chatInput?.focus(), 200);
        } else {
            this.stopSpeaking();
        }
    }

    handleSend() {
        const text = this.chatInput.value.trim();
        if (!text) return;
        this.chatInput.value = '';
        this.sendMessage(text);
    }

    appendMessage(text, sender = 'user', actionData = null) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble bubble-${sender}`;
        
        // Simple markdown parsing for bold & bullets
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n•/g, '<br/>•')
            .replace(/\n/g, '<br/>');

        bubble.innerHTML = formatted;

        // If action data includes booking recommendation (strictly for guests only)
        const currentRole = window.App?.currentUser?.role || this.currentRole || 'guest';
        if (actionData && actionData.suggested_booking && actionData.entities && currentRole === 'guest') {
            const e = actionData.entities;
            const actionBtn = document.createElement('button');
            actionBtn.className = 'btn-luxury-primary';
            actionBtn.style.cssText = 'margin-top: 10px; width: 100%; font-size: 0.78rem; padding: 7px 12px; justify-content: center;';
            actionBtn.innerHTML = `✦ Reserve ${e.room_type} (${e.check_in})`;
            actionBtn.onclick = () => {
                this.stopSpeaking();
                if (window.App) {
                    window.App.openBookingModal({
                        room_type: e.room_type,
                        check_in: e.check_in,
                        check_out: e.check_out,
                        guests: e.guests
                    });
                }
            };
            bubble.appendChild(actionBtn);
        }

        // Add a friendly Voice Read/Stop button to AI messages
        if (sender === 'ai' && !bubble.id?.includes('thinking')) {
            const footer = document.createElement('div');
            footer.className = 'bubble-footer';
            const voiceBtn = document.createElement('button');
            voiceBtn.type = 'button';
            voiceBtn.className = 'bubble-voice-btn';
            voiceBtn.innerHTML = `🔊 Read aloud`;
            voiceBtn.title = "Read aloud or stop voice";
            voiceBtn.onclick = (e) => {
                e.stopPropagation();
                if (this.isSpeaking && this.activeVoiceBubbleBtn === voiceBtn) {
                    this.stopSpeaking();
                } else {
                    this.speak(text, voiceBtn);
                }
            };
            footer.appendChild(voiceBtn);
            bubble.appendChild(footer);
            bubble._voiceBtn = voiceBtn;
        }

        this.messagesContainer.appendChild(bubble);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return bubble;
    }

    updateRoleUI(role = 'guest') {
        this.currentRole = role;
        const badge = document.getElementById('conciergeRoleBadge');
        const chipsContainer = document.getElementById('conciergeChips');

        const roleConfig = {
            manager: {
                label: '👑 EXECUTIVE MODE',
                chips: [
                    '📊 Revenue & Bookings',
                    '🏨 Occupancy & Rates',
                    '📈 Surge Pricing Status',
                    '👑 VIP Guest Arrivals',
                    '👋 Say hello to NOVA'
                ]
            },
            staff: {
                label: '👔 OPERATIONS MODE',
                chips: [
                    "📋 Today's Check-ins",
                    '🚪 Room Status & Turnover',
                    '💳 Pending Guest Payments',
                    '🧹 Housekeeping Schedule',
                    '👋 Say hello to NOVA'
                ]
            },
            guest: {
                label: '✨ GUEST MODE',
                chips: [
                    '✨ Available Suites & Rates',
                    '🔍 Check My Reservation',
                    '🍽️ Dining & Sky Pool',
                    '🕒 Check-in & Policies',
                    '👋 Just saying hello!'
                ]
            }
        };

        const config = roleConfig[role] || roleConfig.guest;

        if (badge) {
            badge.innerText = config.label;
            badge.className = `concierge-role-badge role-${role}`;
        }

        if (chipsContainer) {
            chipsContainer.innerHTML = '';
            config.chips.forEach(chipText => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'chip-btn';
                chip.innerText = chipText;
                chip.onclick = () => {
                    this.stopSpeaking();
                    // Clean prefix emoji if sending to engine
                    const cleanQuery = chipText.replace(/^[^\w\s]+\s*/, '');
                    this.sendMessage(cleanQuery);
                };
                chipsContainer.appendChild(chip);
            });
        }
    }

    async sendMessage(text) {
        this.stopSpeaking();
        this.appendMessage(text, 'user');
        this.history.push({ role: 'user', content: text });

        // Show thinking indicator
        const thinkingBubble = document.createElement('div');
        thinkingBubble.className = 'chat-bubble bubble-ai';
        thinkingBubble.id = 'thinkingIndicator';
        thinkingBubble.innerHTML = '<span style="color: var(--accent); display: flex; align-items: center; gap: 6px;"><span class="status-pulse-dot"></span> NOVA is thinking...</span>';
        this.messagesContainer.appendChild(thinkingBubble);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

        if (this.statusText) this.statusText.innerText = "NOVA is thinking...";

        try {
            const role = window.App?.currentUser?.role || this.currentRole || 'guest';
            const username = window.App?.currentUser?.username || null;

            const res = await API.chatWithConcierge(text, this.history, role, username);
            thinkingBubble.remove();

            if (res.success && res.data) {
                const reply = res.data.reply;
                const aiBubble = this.appendMessage(reply, 'ai', res.data.action_data);
                this.history.push({ role: 'assistant', content: reply });
                
                // Speak if voice enabled
                if (this.isVoiceEnabled && aiBubble) {
                    this.speak(reply, aiBubble._voiceBtn);
                } else {
                    if (this.statusText) this.statusText.innerText = "Online • Your AI Friend & Concierge";
                }
            } else {
                this.appendMessage("I experienced a quick hiccup with my connection. Could you say that again?", 'ai');
                if (this.statusText) this.statusText.innerText = "Online • Your AI Friend & Concierge";
            }
        } catch (err) {
            thinkingBubble.remove();
            this.appendMessage("I'm having a little trouble connecting to the hotel system right now. Please check if the server is running!", 'ai');
            if (this.statusText) this.statusText.innerText = "Online • Your AI Friend & Concierge";
        }
    }
}

window.AIConcierge = AIConcierge;
