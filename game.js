// Galactic FION Hub - Game Logic
document.addEventListener('DOMContentLoaded', function() {
    // Terms of Service Modal
    const tosModalOverlay = document.getElementById('tos-modal-overlay');
    const tosAcceptButton = document.getElementById('tos-accept');
    
    // Check if user has already accepted the terms
    const hasAcceptedTerms = localStorage.getItem('fionTermsAccepted');
    
    if (hasAcceptedTerms) {
        tosModalOverlay.style.display = 'none';
    }
    
    // Handle terms acceptance
    tosAcceptButton.addEventListener('click', function() {
        // Add a glitch effect before hiding
        tosModalOverlay.classList.add('animate-glitch');
        
        // Play a sound effect
        const successSound = document.getElementById('success-sound');
        successSound.play().catch(e => console.log('Audio play was prevented:', e));
        
        // Hide the modal with a delay for effect
        setTimeout(() => {
            tosModalOverlay.style.display = 'none';
            // Save acceptance to localStorage
            localStorage.setItem('fionTermsAccepted', 'true');
            
            // Start background music after terms acceptance
            const backgroundMusic = document.getElementById('background-music');
            backgroundMusic.volume = 0.3;
            backgroundMusic.play().catch(e => console.log('Audio autoplay was prevented:', e));
        }, 800);
    });
    
    // Game state
    const gameState = {
        balance: 100,
        playerName: '',
        playerAvatar: '',
        planetLevel: 1,
        traders: [],
        buildings: [],
        goods: [],
        capitalismPoints: 0,
        activeTraders: 0,
        activeBuildings: 0,
        characterCreated: false,
        traderIdCounter: 0,
        goodIdCounter: 0,
        buildingIdCounter: 0
    };

    // DOM Elements
    const balanceEl = document.getElementById('balance');
    const playerNameEl = document.getElementById('player-name');
    const playerAvatarEl = document.getElementById('player-avatar');
    const playerInfoEl = document.getElementById('player-info');
    const planetLevelEl = document.getElementById('planet-level');
    const traderCountEl = document.getElementById('trader-count');
    const buildingCountEl = document.getElementById('building-count');
    const capitalismPointsEl = document.getElementById('capitalism-points');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalClose = document.getElementById('modal-close');
    const sellPlanetBtn = document.getElementById('sell-planet-btn');
    const shareTwitterBtn = document.getElementById('share-twitter');
    const goodsContainer = document.getElementById('goods-container');
    const tradersContainer = document.getElementById('traders-container');
    const buildingsContainer = document.getElementById('buildings-container');
    const createGoodsForm = document.getElementById('create-goods-form');
    const createCharacterForm = document.getElementById('create-character-form');
    const leaderboardBody = document.getElementById('leaderboard-body');
    
    // Audio elements
    const backgroundMusic = document.getElementById('background-music');
    const successSound = document.getElementById('success-sound');
    const errorSound = document.getElementById('error-sound');
    const touchSound = document.getElementById('touch-sound');

    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Play touch sound
            touchSound.volume = 0.5;
            touchSound.currentTime = 0;
            touchSound.play().catch(e => console.log('Audio play was prevented:', e));
            
            const tabName = button.getAttribute('data-tab');
            
            // If character is not created, only allow character creation tab
            if (!gameState.characterCreated && tabName !== 'create-character' && tabName !== 'whitepaper') {
                showModal('Character Required', 'You need to create a character first!');
                return;
            }
            
            // Deactivate all tabs
            tabButtons.forEach(btn => btn.classList.remove('active', 'bg-purple-800'));
            tabButtons.forEach(btn => btn.classList.add('bg-gray-800'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activate selected tab
            button.classList.remove('bg-gray-800');
            button.classList.add('active', 'bg-purple-800');
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Start background music on first interaction
            if (backgroundMusic.paused) {
                backgroundMusic.volume = 0.3;
                backgroundMusic.play().catch(e => console.log('Audio autoplay was prevented:', e));
            }
        });
    });

    // Modal functions
    function showModal(title, text) {
        modalTitle.textContent = title;
        modalText.textContent = text;
        modalOverlay.classList.add('show');
        modalContent.classList.add('show');
        modalOverlay.classList.remove('hidden');
    }

    function hideModal() {
        modalOverlay.classList.add('hide');
        modalContent.classList.add('hide');
        setTimeout(() => {
            modalOverlay.classList.remove('show', 'hide');
            modalContent.classList.remove('show', 'hide');
            modalOverlay.classList.add('hidden');
        }, 300);
    }

    modalClose.addEventListener('click', hideModal);

    // Notification system
    function showNotification(message, isSuccess = true) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Add color based on success/error
        if (isSuccess) {
            notification.style.backgroundColor = '#8b5cf6';
            successSound.play().catch(e => console.log('Audio play was prevented:', e));
        } else {
            notification.style.backgroundColor = '#ef4444';
            errorSound.play().catch(e => console.log('Audio play was prevented:', e));
        }
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Currency formatting
    function formatFION(amount) {
        return amount.toLocaleString();
    }

    // Update UI with game state
    function updateUI() {
        balanceEl.textContent = formatFION(gameState.balance);
        planetLevelEl.textContent = gameState.planetLevel;
        traderCountEl.textContent = gameState.activeTraders;
        buildingCountEl.textContent = gameState.activeBuildings;
        capitalismPointsEl.textContent = formatFION(gameState.capitalismPoints);
        
        // Check for level up
        checkLevelUp();
    }

    // Check if player should level up
    function checkLevelUp() {
        const levelRequirements = [
            { traders: 0, buildings: 0 },
            { traders: 5, buildings: 2 },
            { traders: 10, buildings: 5 },
            { traders: 20, buildings: 10 },
            { traders: 30, buildings: 15 }
        ];
        
        const nextLevel = gameState.planetLevel + 1;
        if (nextLevel <= 5 && 
            gameState.activeTraders >= levelRequirements[nextLevel-1].traders && 
            gameState.activeBuildings >= levelRequirements[nextLevel-1].buildings) {
            
            gameState.planetLevel = nextLevel;
            planetLevelEl.textContent = gameState.planetLevel;
            
            showModal('Level Up!', `Your planet has reached level ${nextLevel}! New buildings and opportunities are now available.`);
            
            // Add capitalism points for level up
            addCapitalismPoints(nextLevel * 100);
        }
    }

    // Add capitalism points
    function addCapitalismPoints(points) {
        gameState.capitalismPoints += points;
        capitalismPointsEl.textContent = formatFION(gameState.capitalismPoints);
        
        // Update leaderboard
        updateLeaderboard();
    }

    // Update FION balance
    function updateBalance(amount) {
        gameState.balance += amount;
        balanceEl.textContent = formatFION(gameState.balance);
        
        // Visual feedback
        if (amount > 0) {
            balanceEl.classList.add('text-green-400');
            setTimeout(() => balanceEl.classList.remove('text-green-400'), 500);
        } else if (amount < 0) {
            balanceEl.classList.add('text-red-400');
            setTimeout(() => balanceEl.classList.remove('text-red-400'), 500);
        }
    }

    // Check if player can afford something
    function canAfford(cost) {
        if (gameState.balance >= cost) {
            return true;
        }
        showNotification(`Not enough $FION! You need ${formatFION(cost)} $FION.`, false);
        return false;
    }

    // Character creation
    createCharacterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('character-name').value.trim();
        if (!name) {
            showNotification('Please enter a trader name!', false);
            return;
        }
        
        // Get selected avatar
        const selectedAvatar = document.querySelector('.avatar-option.active img').src;
        
        // Update game state
        gameState.playerName = name;
        gameState.playerAvatar = selectedAvatar;
        gameState.characterCreated = true;
        
        // Update UI
        playerNameEl.textContent = name;
        playerAvatarEl.src = selectedAvatar;
        playerInfoEl.classList.remove('hidden');
        
        // Show success and switch to goods tab
        showNotification('Character created successfully!');
        document.querySelector('[data-tab="goods"]').click();
        
        // Add capitalism points
        addCapitalismPoints(10);
        
        // Save game
        saveGame();
    });

    // Avatar selection
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(option => {
        option.addEventListener('click', () => {
            avatarOptions.forEach(opt => opt.classList.remove('active', 'border-purple-500'));
            avatarOptions.forEach(opt => opt.classList.add('border-gray-600'));
            option.classList.remove('border-gray-600');
            option.classList.add('active', 'border-purple-500');
        });
    });

    // Good image selection
    const imageOptions = document.querySelectorAll('.image-option');
    imageOptions.forEach(option => {
        option.addEventListener('click', () => {
            imageOptions.forEach(opt => opt.classList.remove('active', 'border-purple-500'));
            imageOptions.forEach(opt => opt.classList.add('border-gray-600'));
            option.classList.remove('border-gray-600');
            option.classList.add('active', 'border-purple-500');
        });
    });

    // Create goods form
    createGoodsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const creationCost = 50;
        if (!canAfford(creationCost)) return;
        
        const name = document.getElementById('good-name').value.trim();
        const description = document.getElementById('good-description').value.trim();
        const price = parseInt(document.getElementById('good-price').value);
        
        if (!name || !description || isNaN(price) || price < 1) {
            showNotification('Please fill out all fields correctly!', false);
            return;
        }
        
        // Get selected image
        const selectedImage = document.querySelector('.image-option.active img').src;
        
        // Create new good
        const newGood = {
            id: 'good_' + (++gameState.goodIdCounter),
            name: name,
            description: description,
            image: selectedImage,
            price: price,
            quantity: 0,
            productionLevel: 1
        };
        
        // Add to game state
        gameState.goods.push(newGood);
        
        // Deduct creation cost
        updateBalance(-creationCost);
        
        // Add capitalism points
        addCapitalismPoints(20);
        
        // Create and display good card
        createGoodCard(newGood);
        
        // Show success and switch to goods tab
        showNotification('Good created successfully!');
        document.querySelector('[data-tab="goods"]').click();
        
        // Reset form
        createGoodsForm.reset();
        
        // Save game
        saveGame();
    });

    // Create good card
    function createGoodCard(good) {
        const card = document.createElement('div');
        card.className = 'good-card bg-gray-800 rounded-lg overflow-hidden shadow-lg new-item';
        card.id = good.id;
        
        card.innerHTML = `
            <div class="relative">
                <img src="${good.image}" alt="${good.name}" class="w-full h-32 object-contain bg-gray-700 pixel-art">
                <div class="absolute top-2 right-2 bg-purple-900 text-yellow-400 px-2 py-1 rounded-full text-xs font-bold">
                    ${formatFION(good.price)} $FION
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-purple-300 mb-1">${good.name}</h3>
                <p class="text-sm text-gray-300 mb-2">${good.description}</p>
                <div class="flex justify-between items-center text-sm mb-2">
                    <span>Production Level:</span>
                    <span>${good.productionLevel}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span>Quantity:</span>
                    <span id="${good.id}_quantity">${good.quantity}</span>
                </div>
                <button class="sell-good-btn mt-4 w-full bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors" data-id="${good.id}">
                    Sell Good
                </button>
            </div>
        `;
        
        goodsContainer.appendChild(card);
        
        // Add event listener to sell button
        card.querySelector('.sell-good-btn').addEventListener('click', () => sellGood(good.id));
    }

    // Sell good
    function sellGood(goodId) {
        const good = gameState.goods.find(g => g.id === goodId);
        if (!good) return;
        
        if (good.quantity <= 0) {
            showNotification('No goods available to sell!', false);
            return;
        }
        
        // Sell one unit
        good.quantity--;
        document.getElementById(`${good.id}_quantity`).textContent = good.quantity;
        
        // Add money
        updateBalance(good.price);
        
        // Add capitalism points
        addCapitalismPoints(good.price / 2);
        
        showNotification(`Sold one ${good.name} for ${formatFION(good.price)} $FION!`);
        
        // Save game
        saveGame();
    }

    // Generate alien trader
    function generateTrader() {
        // Trader types with different appearances
        const traderTypes = [
            { name: 'Zorgon', image: 'img/planetary_customs/IMG_20250523_194630.jpg' },
            { name: 'Blipblop', image: 'img/planetary_customs/IMG_20250523_194647.jpg' },
            { name: 'Qwerty', image: 'img/planetary_customs/IMG_20250523_194705.jpg' },
            { name: 'Xeno', image: 'img/planetary_customs/IMG_20250523_194720.jpg' },
            { name: 'Flurb', image: 'img/planetary_customs/IMG_20250523_194737.jpg' },
            { name: 'Gleep', image: 'img/planetary_customs/IMG_20250523_194749.jpg' },
            { name: 'Zorb', image: 'img/planetary_customs/IMG_20250523_194803.jpg' },
            { name: 'Quasar', image: 'img/planetary_customs/IMG_20250523_195409.jpg' },
            { name: 'Nebula', image: 'img/planetary_customs/IMG_20250523_195426.jpg' },
            { name: 'Pulsar', image: 'img/planetary_customs/IMG_20250523_195452.jpg' },
            { name: 'Vortex', image: 'img/planetary_customs/IMG_20250523_195509.jpg' },
            { name: 'Glimmer', image: 'img/planetary_customs/IMG_20250523_195544.jpg' },
            { name: 'Stargazer', image: 'img/planetary_customs/IMG_20250523_195807.jpg' },
            { name: 'Cosmo', image: 'img/planetary_customs/IMG_20250523_195824.jpg' },
            { name: 'Astral', image: 'img/planetary_customs/IMG_20250523_195837.jpg' },
            { name: 'Lumina', image: 'img/planetary_customs/IMG_20250523_195852.jpg' },
            { name: 'Orion', image: 'img/planetary_customs/IMG_20250523_195910.jpg' },
            { name: 'Eclipse', image: 'img/planetary_customs/IMG_20250523_195925.jpg' },
            { name: 'Zenith', image: 'img/planetary_customs/IMG_20250523_195938.jpg' },
            { name: 'Nova', image: 'img/planetary_customs/IMG_20250523_195950.jpg' },
            { name: 'Comet', image: 'img/planetary_customs/IMG_20250523_200001.jpg' },
            { name: 'Celestial', image: 'img/planetary_customs/IMG_20250523_200015.jpg' }
        ];
        
        // Keep track of used trader images to avoid repetition
        if (!gameState.usedTraderImages) {
            gameState.usedTraderImages = [];
        }
        
        // If all images have been used, reset the tracking array
        if (gameState.usedTraderImages.length >= traderTypes.length) {
            gameState.usedTraderImages = [];
        }
        
        // Filter out already used trader images
        const availableTraderTypes = traderTypes.filter(trader => 
            !gameState.usedTraderImages.includes(trader.image)
        );
        
        // Random trader descriptions
        const descriptions = [
            "Has three stomachs, all filled with trading contracts.",
            "Claims to be from the 5th dimension. Seems legit.",
            "Communicates through interpretive dance and profitable deals.",
            "Has never seen a bad deal they didn't immediately improve.",
            "Carries a calculator with 17 different alien number systems.",
            "Can smell a profitable trade from 3 parsecs away.",
            "Has tentacles specifically evolved for signing contracts.",
            "Trades faster than light can travel in most systems.",
            "Hibernates for 11 months, makes annual profit in 1 month.",
            "Believes that money is just a social construct, but loves it anyway.",
            "Has 7 eyes, all focused on market trends.",
            "Breathes different gases depending on market conditions.",
            "Carries trade goods in a pocket dimension. Very convenient.",
            "Evolved specifically to maximize profit margins.",
            "Can predict market trends by tasting the cosmic background radiation."
        ];
        
        // Random goods
        const possibleGoods = [
            { name: "Quantum Crystals", image: "img/Specializes/Quantum_Crystals.png", price: 15, description: "Shimmering crystals that exist in multiple dimensions simultaneously." },
            { name: "Gravity Bubbles", image: "img/Specializes/Gravity_Bubbles.png", price: 25, description: "Contained pockets of altered gravity. Popular as paperweights." },
            { name: "Nebula Nectar", image: "img/Specializes/Nebula_Nectar.png", price: 20, description: "Sweet liquid harvested from the heart of nebulae. Glows in the dark." },
            { name: "Void Pearls", image: "img/Specializes/Void_Pearls.png", price: 30, description: "Black spheres that absorb all light. Fashionable jewelry across the galaxy." },
            { name: "Stellar Spice", image: "img/Specializes/Stellar_Spice.png", price: 18, description: "Seasoning made from pulverized dwarf stars. Extremely hot." },
            { name: "Cosmic Cogs", image: "img/Specializes/Cosmic_Cogs.png", price: 22, description: "Mechanical parts that adjust their size based on nearby mass." },
            { name: "Warp Whiskers", image: "img/Specializes/Warp_Whiskers.png", price: 27, description: "Filaments that vibrate at FTL frequencies. Used in luxury pillows." },
            { name: "Plasma Petals", image: "img/Specializes/Plasma_Petals.png", price: 23, description: "Flowers that bloom in the coronas of stars. Never wilt." }
        ];
        
        // Select random elements
        const traderType = availableTraderTypes[Math.floor(Math.random() * availableTraderTypes.length)];
        // Add the selected image to used images
        gameState.usedTraderImages.push(traderType.image);
        
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        const good = {...possibleGoods[Math.floor(Math.random() * possibleGoods.length)]};
        
        // Generate random skills (1-10)
        const tradingSkill = Math.floor(Math.random() * 10) + 1;
        const persuasionSkill = Math.floor(Math.random() * 10) + 1;
        const deliverySkill = Math.floor(Math.random() * 10) + 1;
        
        // Determine if trader is rare (10% chance)
        const isRare = Math.random() < 0.1;
        
        // Calculate hire cost based on skills
        const hireCost = Math.floor((tradingSkill + persuasionSkill + deliverySkill) * 5 * (isRare ? 1.5 : 1));
        
        // Adjust good production rate based on skills
        good.productionLevel = Math.max(1, Math.floor((tradingSkill + deliverySkill) / 4));
        
        // Create trader object
        const trader = {
            id: 'trader_' + (++gameState.traderIdCounter),
            name: `${traderType.name} #${Math.floor(Math.random() * 1000)}`,
            image: traderType.image,
            description: description,
            tradingSkill: tradingSkill,
            persuasionSkill: persuasionSkill,
            deliverySkill: deliverySkill,
            hireCost: hireCost,
            good: good,
            isRare: isRare,
            hired: false
        };
        
        return trader;
    }

    // Create trader card
    function createTraderCard(trader) {
        const card = document.createElement('div');
        card.className = `trader-card bg-gray-800 rounded-lg overflow-hidden shadow-lg new-item ${trader.isRare ? 'trader-rare' : ''}`;
        card.id = trader.id;
        
        card.innerHTML = `
            <div class="relative">
                <div class="w-full h-32 flex items-center justify-center" style="background: linear-gradient(135deg, #4b0082, #9400d3)">
                    <img src="${trader.image}" alt="${trader.name}" class="h-28 object-contain">
                </div>
                <div class="absolute top-2 right-2 bg-purple-900 text-yellow-400 px-2 py-1 rounded-full text-xs font-bold">
                    ${trader.isRare ? 'RARE' : 'COMMON'}
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-purple-300 mb-1">${trader.name}</h3>
                <p class="text-sm text-gray-300 mb-2">${trader.description}</p>
                
                <div class="mb-2">
                    <div class="flex justify-between text-xs mb-1">
                        <span>Trading:</span>
                        <span>${trader.tradingSkill}/10</span>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-fill" style="width: ${trader.tradingSkill * 10}%"></div>
                    </div>
                </div>
                
                <div class="mb-2">
                    <div class="flex justify-between text-xs mb-1">
                        <span>Persuasion:</span>
                        <span>${trader.persuasionSkill}/10</span>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-fill" style="width: ${trader.persuasionSkill * 10}%"></div>
                    </div>
                </div>
                
                <div class="mb-2">
                    <div class="flex justify-between text-xs mb-1">
                        <span>Delivery:</span>
                        <span>${trader.deliverySkill}/10</span>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-fill" style="width: ${trader.deliverySkill * 10}%"></div>
                    </div>
                </div>
                
                <div class="mt-3 p-2 bg-gray-700 rounded">
                    <div class="text-xs font-bold mb-2 text-center text-purple-300">Specializes in:</div>
                    <div class="flex items-center">
                        <div class="w-12 h-12 mr-3 rounded-full overflow-hidden flex items-center justify-center" style="background: linear-gradient(45deg, #2d1b4e, #663399)">
                            <img src="${trader.good.image}" alt="${trader.good.name}" class="w-10 h-10 object-contain">
                        </div>
                        <div>
                            <div class="text-sm font-bold text-yellow-300">${trader.good.name}</div>
                            <div class="text-xs">${formatFION(trader.good.price)} $FION</div>
                        </div>
                    </div>
                </div>
                
                <button class="hire-trader-btn mt-4 w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition-colors" data-id="${trader.id}">
                    Hire for ${formatFION(trader.hireCost)} $FION
                </button>
            </div>
        `;
        
        tradersContainer.appendChild(card);
        
        // Add event listener to hire button
        card.querySelector('.hire-trader-btn').addEventListener('click', () => hireTrader(trader.id));
    }

    // Hire trader
    function hireTrader(traderId) {
        const trader = gameState.traders.find(t => t.id === traderId);
        if (!trader || trader.hired) return;
        
        if (!canAfford(trader.hireCost)) return;
        
        // Hire trader
        trader.hired = true;
        updateBalance(-trader.hireCost);
        
        // Update trader count
        gameState.activeTraders++;
        traderCountEl.textContent = gameState.activeTraders;
        
        // Add trader's good to player's goods if not already present
        let playerGood = gameState.goods.find(g => g.name === trader.good.name);
        if (!playerGood) {
            // Create new good
            playerGood = {...trader.good, id: 'good_' + (++gameState.goodIdCounter), quantity: 0};
            gameState.goods.push(playerGood);
            createGoodCard(playerGood);
        }
        
        // Remove trader card from customs
        const traderCard = document.getElementById(trader.id);
        traderCard.classList.add('hired');
        setTimeout(() => traderCard.remove(), 500);
        
        // Add capitalism points
        addCapitalismPoints(trader.hireCost / 5);
        
        showNotification(`Hired ${trader.name}!`);
        
        // Save game
        saveGame();
        
        // Check for level up
        checkLevelUp();
    }
    
    // Generate buildings
    function initializeBuildings() {
        const buildingTypes = [
            {
                name: "Spaceport",
                description: "Increases trader arrival frequency by 20% per level.",
                image: "img/Buildings/IMG_20250523_202003.jpg",
                baseCost: 100,
                effect: "traderFrequency",
                effectValue: 0.2,
                maxLevel: 5
            },
            {
                name: "Alien Hotel",
                description: "Increases chance of rare traders by 5% per level.",
                image: "img/Buildings/Alien__hotel.jpg",
                baseCost: 150,
                effect: "rareChance",
                effectValue: 0.05,
                maxLevel: 5
            },
            {
                name: "Gravimolecule Factory",
                description: "Speeds up goods production by 15% per level.",
                image: "img/Buildings/IMG_20250523_202052.jpg",
                baseCost: 200,
                effect: "productionSpeed",
                effectValue: 0.15,
                maxLevel: 5
            },
            {
                name: "Magnetic Market",
                description: "Increases goods selling price by 10% per level.",
                image: "img/Buildings/Magnetic_Market.jpg",
                baseCost: 250,
                effect: "sellingPrice",
                effectValue: 0.1,
                maxLevel: 5
            },
            {
                name: "Quantum Warehouse",
                description: "Increases maximum goods storage by 50 per level.",
                image: "img/Buildings/IMG_20250523_202112.jpg",
                baseCost: 175,
                effect: "storage",
                effectValue: 50,
                maxLevel: 5
            },
            {
                name: "Galactic Academy",
                description: "Improves trader skills by 10% per level.",
                image: "img/Buildings/IMG_20250523_202131.jpg",
                baseCost: 300,
                effect: "traderSkills",
                effectValue: 0.1,
                maxLevel: 5
            },
            {
                name: "Wormhole Generator",
                description: "Reduces building costs by 5% per level.",
                image: "img/Buildings/IMG_20250523_202149.jpg",
                baseCost: 350,
                effect: "buildingCost",
                effectValue: 0.05,
                maxLevel: 5
            },
            {
                name: "Cosmic Bank",
                description: "Generates 10 $FION per minute per level.",
                image: "img/Buildings/IMG_20250523_202253.jpg",
                baseCost: 400,
                effect: "passiveIncome",
                effectValue: 10,
                maxLevel: 5
            }
        ];
        
        // Create building objects
        buildingTypes.forEach(type => {
            const building = {
                id: 'building_' + (++gameState.buildingIdCounter),
                name: type.name,
                description: type.description,
                image: type.image,
                effect: type.effect,
                effectValue: type.effectValue,
                baseCost: type.baseCost,
                level: 0,
                maxLevel: type.maxLevel
            };
            
            gameState.buildings.push(building);
            createBuildingCard(building);
        });
    }
    
    // Create building card
    function createBuildingCard(building) {
        const card = document.createElement('div');
        card.className = 'building-card bg-gray-800 rounded-lg overflow-hidden shadow-lg';
        card.id = building.id;
        
        // Calculate upgrade cost
        const upgradeCost = building.level === 0 
            ? building.baseCost 
            : Math.floor(building.baseCost * Math.pow(1.5, building.level));
        
        // Calculate current effect
        const currentEffect = building.level * building.effectValue;
        const nextEffect = (building.level + 1) * building.effectValue;
        
        card.innerHTML = `
            <div class="relative">
                <div class="w-full h-32 flex items-center justify-center" style="background: linear-gradient(135deg, #4b0082, #9400d3)">
                    <img src="${building.image}" alt="${building.name}" class="h-28 object-contain">
                </div>
                <div class="absolute top-2 right-2 bg-purple-900 text-yellow-400 px-2 py-1 rounded-full text-xs font-bold">
                    Level ${building.level}/${building.maxLevel}
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-purple-300 mb-1">${building.name}</h3>
                <p class="text-sm text-gray-300 mb-2">${building.description}</p>
                
                <div class="mb-2 text-xs">
                    <div class="flex justify-between mb-1">
                        <span>Current Effect:</span>
                        <span>${formatEffect(building.effect, currentEffect)}</span>
                    </div>
                    ${building.level < building.maxLevel ? `
                    <div class="flex justify-between">
                        <span>Next Level:</span>
                        <span>${formatEffect(building.effect, nextEffect)}</span>
                    </div>
                    ` : ''}
                </div>
                
                ${building.level < building.maxLevel ? `
                <button class="upgrade-building-btn mt-4 w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition-colors" data-id="${building.id}">
                    ${building.level === 0 ? 'Build' : 'Upgrade'} for ${formatFION(upgradeCost)} $FION
                </button>
                ` : `
                <button class="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded" disabled>
                    Maximum Level Reached
                </button>
                `}
            </div>
        `;
        
        buildingsContainer.appendChild(card);
        
        // Add event listener to upgrade button if not max level
        if (building.level < building.maxLevel) {
            card.querySelector('.upgrade-building-btn').addEventListener('click', () => upgradeBuilding(building.id));
        }
    }
    
    // Format effect based on type
    function formatEffect(effectType, value) {
        switch (effectType) {
            case 'traderFrequency':
            case 'productionSpeed':
            case 'sellingPrice':
            case 'traderSkills':
                return `+${(value * 100).toFixed(0)}%`;
            case 'rareChance':
            case 'buildingCost':
                return `${(value * 100).toFixed(0)}%`;
            case 'storage':
                return `+${value.toFixed(0)}`;
            case 'passiveIncome':
                return `${value.toFixed(0)}/min`;
            default:
                return value.toFixed(2);
        }
    }
    
    // Upgrade building
    function upgradeBuilding(buildingId) {
        const building = gameState.buildings.find(b => b.id === buildingId);
        if (!building || building.level >= building.maxLevel) return;
        
        // Calculate upgrade cost
        const upgradeCost = building.level === 0 
            ? building.baseCost 
            : Math.floor(building.baseCost * Math.pow(1.5, building.level));
        
        if (!canAfford(upgradeCost)) return;
        
        // Upgrade building
        building.level++;
        updateBalance(-upgradeCost);
        
        // Update active buildings count if this is the first level
        if (building.level === 1) {
            gameState.activeBuildings++;
            buildingCountEl.textContent = gameState.activeBuildings;
        }
        
        // Update building card
        const buildingCard = document.getElementById(building.id);
        buildingCard.remove();
        createBuildingCard(building);
        
        // Add capitalism points
        addCapitalismPoints(upgradeCost / 10);
        
        showNotification(`${building.name} ${building.level === 1 ? 'built' : 'upgraded to level ' + building.level}!`);
        
        // Save game
        saveGame();
        
        // Check for level up
        checkLevelUp();
    }
    
    // Update leaderboard
    function updateLeaderboard() {
        // Clear existing entries
        leaderboardBody.innerHTML = '';
        
        // Generate fake planets
        const fakePlanets = [
            { name: "Nexus Prime", level: 5, points: 15000 },
            { name: "Zeta Centauri", level: 4, points: 12000 },
            { name: "Quantum Hub", level: 4, points: 10000 },
            { name: "Epsilon Trading Post", level: 3, points: 8000 },
            { name: "Galactic Bazaar", level: 3, points: 6000 },
            { name: "Void Market", level: 2, points: 4000 },
            { name: "Stellar Exchange", level: 2, points: 3000 },
            { name: "Cosmic Depot", level: 1, points: 2000 },
            { name: "Nebula Outpost", level: 1, points: 1000 }
        ];
        
        // Add player to the list
        const allPlanets = [
            { name: gameState.playerName + "'s Planet", level: gameState.planetLevel, points: gameState.capitalismPoints, isPlayer: true },
            ...fakePlanets
        ];
        
        // Sort by points
        allPlanets.sort((a, b) => b.points - a.points);
        
        // Create leaderboard entries
        allPlanets.forEach((planet, index) => {
            const row = document.createElement('tr');
            row.className = planet.isPlayer ? 'bg-purple-900 bg-opacity-30' : '';
            
            row.innerHTML = `
                <td class="py-2">${index + 1}</td>
                <td class="py-2">
                    ${planet.name}
                    ${index === 0 ? '<span class="crown">👑</span>' : ''}
                </td>
                <td class="py-2">${planet.level}</td>
                <td class="py-2 text-right">${formatFION(planet.points)}</td>
            `;
            
            leaderboardBody.appendChild(row);
        });
    }
    
    // Share on Twitter
    shareTwitterBtn.addEventListener('click', () => {
        const playerRank = Array.from(leaderboardBody.querySelectorAll('tr')).findIndex(row => 
            row.classList.contains('bg-purple-900')
        ) + 1;
        
        const tweetText = `I'm ranked #${playerRank} on the Galactic Capitalism Board with ${formatFION(gameState.capitalismPoints)} points in Galactic FION Hub! My trading planet is level ${gameState.planetLevel}! #GalacticFIONHub #SpaceTrading`;
        
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(twitterUrl, '_blank');
    });
    
    // Sell Planet button
    sellPlanetBtn.addEventListener('click', () => {
        showModal('Are you sure?', 'Do you really want to sell your planet? Here, take 5 $FION and stop whining!');
        updateBalance(5);
        addCapitalismPoints(1);
        saveGame();
    });
    
    // Game loop
    let lastTraderTime = 0;
    let lastProductionTime = 0;
    let lastIncomeTime = 0;
    let maxTraders = 50;
    
    function gameLoop() {
        const now = Date.now();
        
        // Generate new trader every 5 seconds
        if (now - lastTraderTime > 5000) {
            if (gameState.characterCreated && gameState.traders.filter(t => !t.hired).length < maxTraders) {
                // Apply spaceport effect to trader frequency
                const spaceport = gameState.buildings.find(b => b.name === "Spaceport");
                const frequencyBonus = spaceport ? 1 - (spaceport.level * spaceport.effectValue) : 1;
                
                // Only generate if enough time has passed with bonus
                if (now - lastTraderTime > 5000 * frequencyBonus) {
                    // Apply hotel effect to rare chance
                    const hotel = gameState.buildings.find(b => b.name === "Alien Hotel");
                    const rareBonus = hotel ? hotel.level * hotel.effectValue : 0;
                    
                    // Generate trader with modified rare chance
                    const trader = generateTrader();
                    if (Math.random() < 0.1 + rareBonus) {
                        trader.isRare = true;
                    }
                    
                    // Apply academy effect to trader skills
                    const academy = gameState.buildings.find(b => b.name === "Galactic Academy");
                    if (academy && academy.level > 0) {
                        const skillBonus = academy.level * academy.effectValue;
                        trader.tradingSkill = Math.min(10, Math.floor(trader.tradingSkill * (1 + skillBonus)));
                        trader.persuasionSkill = Math.min(10, Math.floor(trader.persuasionSkill * (1 + skillBonus)));
                        trader.deliverySkill = Math.min(10, Math.floor(trader.deliverySkill * (1 + skillBonus)));
                    }
                    
                    gameState.traders.push(trader);
                    createTraderCard(trader);
                    lastTraderTime = now;
                }
            }
        }
        
        // Produce goods every 10 seconds
        if (now - lastProductionTime > 10000) {
            // Get hired traders
            const hiredTraders = gameState.traders.filter(t => t.hired);
            
            // Apply factory effect to production speed
            const factory = gameState.buildings.find(b => b.name === "Gravimolecule Factory");
            const productionBonus = factory ? factory.level * factory.effectValue : 0;
            
            // Produce goods for each hired trader
            hiredTraders.forEach(trader => {
                const good = gameState.goods.find(g => g.name === trader.good.name);
                if (good) {
                    // Calculate production amount
                    let productionAmount = good.productionLevel;
                    
                    // Apply rare trader bonus
                    if (trader.isRare) {
                        productionAmount *= 2;
                    }
                    
                    // Apply production bonus
                    productionAmount = Math.floor(productionAmount * (1 + productionBonus));
                    
                    // Add to quantity
                    good.quantity += productionAmount;
                    
                    // Update display if element exists
                    const quantityEl = document.getElementById(`${good.id}_quantity`);
                    if (quantityEl) {
                        quantityEl.textContent = good.quantity;
                    }
                }
            });
            
            lastProductionTime = now;
        }
        
        // Generate passive income every minute
        if (now - lastIncomeTime > 60000) {
            const bank = gameState.buildings.find(b => b.name === "Cosmic Bank");
            if (bank && bank.level > 0) {
                const income = bank.level * bank.effectValue;
                updateBalance(income);
                lastIncomeTime = now;
            }
        }
        
        // Save game every 30 seconds
        if (now % 30000 < 100) {
            saveGame();
        }
        
        requestAnimationFrame(gameLoop);
    }
    
    // Save game to localStorage
    function saveGame() {
        const saveData = {
            balance: gameState.balance,
            playerName: gameState.playerName,
            playerAvatar: gameState.playerAvatar,
            planetLevel: gameState.planetLevel,
            traders: gameState.traders,
            buildings: gameState.buildings,
            goods: gameState.goods,
            capitalismPoints: gameState.capitalismPoints,
            activeTraders: gameState.activeTraders,
            activeBuildings: gameState.activeBuildings,
            characterCreated: gameState.characterCreated,
            traderIdCounter: gameState.traderIdCounter,
            goodIdCounter: gameState.goodIdCounter,
            buildingIdCounter: gameState.buildingIdCounter
        };
        
        localStorage.setItem('galacticFionHub', JSON.stringify(saveData));
    }
    
    // Load game from localStorage
    function loadGame() {
        const saveData = localStorage.getItem('galacticFionHub');
        if (saveData) {
            const loadedData = JSON.parse(saveData);
            
            // Update game state
            Object.assign(gameState, loadedData);
            
            // Update UI
            balanceEl.textContent = formatFION(gameState.balance);
            planetLevelEl.textContent = gameState.planetLevel;
            traderCountEl.textContent = gameState.activeTraders;
            buildingCountEl.textContent = gameState.activeBuildings;
            capitalismPointsEl.textContent = formatFION(gameState.capitalismPoints);
            
            // Update player info if character created
            if (gameState.characterCreated) {
                playerNameEl.textContent = gameState.playerName;
                playerAvatarEl.src = gameState.playerAvatar;
                playerInfoEl.classList.remove('hidden');
            }
            
            // Create cards for goods
            gameState.goods.forEach(good => createGoodCard(good));
            
            // Create cards for non-hired traders
            gameState.traders.filter(t => !t.hired).forEach(trader => createTraderCard(trader));
            
            // Create cards for buildings
            gameState.buildings.forEach(building => createBuildingCard(building));
            
            // Update leaderboard
            updateLeaderboard();
        } else {
            // Initialize buildings for new game
            initializeBuildings();
        }
    }
    
    // Initialize game
    function init() {
        // Load game
        loadGame();
        
        // Start game loop
        gameLoop();
        
        // Start with character creation tab if no character
        if (!gameState.characterCreated) {
            document.querySelector('[data-tab="create-character"]').click();
        } else {
            document.querySelector('[data-tab="goods"]').click();
        }
    }
    
    // Initialize game when DOM is loaded
    init();
});
