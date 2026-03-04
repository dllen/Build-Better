
const fs = require('fs');
const path = require('path');

const srcDir = 'src/data/roms';
const destDir = 'public/roms';

if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
}

const games = [
    { id: 'mario1', patterns: ['Super Mario Bros (U)', 'Super Mario Bros. (U)', 'Super Mario Bros (JU)', 'Super Mario Bros. (JU)', 'Super Mario Bros - Duck Hunt'] },
    { id: 'mario2', patterns: ['Super Mario Bros 2 (U)', 'Super Mario Bros. 2 (U)'] },
    { id: 'mario3', patterns: ['Super Mario Bros 3 (U)', 'Super Mario Bros. 3 (U)'] },
    { id: 'contra', patterns: ['Contra (U)'] },
    { id: 'megaman1', patterns: ['Mega Man (U)'] },
    { id: 'castlevania', patterns: ['Castlevania (U)'] },
    { id: 'ninjagaiden', patterns: ['Ninja Gaiden (U)'] },
    { id: 'metroid', patterns: ['Metroid (U)'] },
    { id: 'adventureisland', patterns: ['Adventure Island (U)'] },
    { id: 'doubledragon', patterns: ['Double Dragon (U)'] },
    { id: 'ghostsngoblins', patterns: ["Ghosts'n Goblins (U)", "Ghosts 'n Goblins (U)"] },
    { id: 'zelda', patterns: ['Legend of Zelda, The (U)', 'Legend of Zelda (U)'] },
    { id: 'finalfantasy', patterns: ['Final Fantasy (U)'] },
    { id: 'dragonquest', patterns: ['Dragon Warrior (U)'] }, // Dragon Quest was Dragon Warrior in US
    { id: 'earthbound', patterns: ['Earth Bound (Prototype)', 'EarthBound Beginnings', 'Mother (E)', 'Mother (U)'] },
    { id: 'tetris', patterns: ['Tetris (U)'] },
    { id: 'bomberman', patterns: ['Bomberman (U)'] },
    { id: 'drmario', patterns: ['Dr. Mario (U)', 'Dr Mario (U)'] },
    { id: 'excitebike', patterns: ['Excitebike (U)', 'Excitebike (JU)'] },
    { id: 'baseball', patterns: ['Baseball (U)', 'Baseball (JU)'] },
    { id: 'punchout', patterns: ['Punch-Out!! (U)', 'Mike Tyson\'s Punch-Out!! (U)'] },
];

try {
    const files = fs.readdirSync(srcDir);
    const foundGames = [];

    games.forEach(game => {
        let bestMatch = null;
        
        // Try to find a file that contains one of the patterns
        for (const pattern of game.patterns) {
            const match = files.find(file => file.toLowerCase().includes(pattern.toLowerCase()) && file.endsWith('.nes'));
            if (match) {
                bestMatch = match;
                break; 
            }
        }

        if (bestMatch) {
            const cleanName = game.id + '.nes'; // Use ID as filename for simplicity
            fs.copyFileSync(path.join(srcDir, bestMatch), path.join(destDir, cleanName));
            foundGames.push({
                id: game.id,
                original: bestMatch,
                clean: cleanName
            });
            console.log(`Found ${game.id}: ${bestMatch} -> ${cleanName}`);
        } else {
            console.log(`Missing ${game.id}`);
        }
    });

    console.log('---JSON---');
    console.log(JSON.stringify(foundGames));

} catch (err) {
    console.error('Error:', err);
}
