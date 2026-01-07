export interface NesGame {
  id: string;
  title: string;
  romUrl: string;
  coverUrl: string;
  description: string;
  genre: 'Action' | 'Adventure' | 'RPG' | 'Puzzle' | 'Strategy' | 'Sports' | 'Racing';
  core?: 'fceumm' | 'nestopia';
}

export const nesGames: NesGame[] = [
  // 1. 平台/动作类
  {
    id: 'mario1',
    title: 'Super Mario Bros.',
    romUrl: '/roms/super_mario_bros.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7d.jpg',
    description: 'The classic platformer that started it all. Save Princess Toadstool from Bowser.',
    genre: 'Action',
  },
  {
    id: 'mario2',
    title: 'Super Mario Bros. 2',
    romUrl: '/roms/super_mario_bros_2.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co209d.jpg',
    description: 'A unique entry in the series with 4 playable characters and vegetable-throwing action.',
    genre: 'Action',
  },
  {
    id: 'mario3',
    title: 'Super Mario Bros. 3',
    romUrl: '/roms/super_mario_bros_3.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1w63.jpg',
    description: 'Often cited as one of the greatest video games of all time. Introduced the world map.',
    genre: 'Action',
  },
  {
    id: 'contra',
    title: 'Contra',
    romUrl: '/roms/contra.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co20a9.jpg',
    description: 'Run and gun action. Up, Up, Down, Down, Left, Right, Left, Right, B, A.',
    genre: 'Action',
  },
  {
    id: 'megaman1',
    title: 'Mega Man',
    romUrl: '/roms/megaman.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co20bi.jpg',
    description: 'The Blue Bomber\'s first adventure. Defeat the Robot Masters and Dr. Wily.',
    genre: 'Action',
  },
  {
    id: 'castlevania',
    title: 'Castlevania',
    romUrl: '/roms/castlevania.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co20b5.jpg',
    description: 'Step into the shadows of the hell house. You are Simon Belmont, out to destroy the evil Count Dracula.',
    genre: 'Action',
  },
  {
    id: 'ninjagaiden',
    title: 'Ninja Gaiden',
    romUrl: '/roms/ninja_gaiden.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co20c6.jpg',
    description: 'Fast-paced ninja action with cinematic cutscenes.',
    genre: 'Action',
  },
  {
    id: 'metroid',
    title: 'Metroid',
    romUrl: '/roms/metroid.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x77.jpg',
    description: 'Explore the planet Zebes and defeat the Mother Brain.',
    genre: 'Action',
  },
  {
    id: 'adventureisland',
    title: 'Adventure Island',
    romUrl: '/roms/adventure_island.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co209q.jpg',
    description: 'Help Master Higgins save Tina from the Evil Witch Doctor.',
    genre: 'Action',
  },
  {
    id: 'doubledragon',
    title: 'Double Dragon',
    romUrl: '/roms/double_dragon.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co20ae.jpg',
    description: 'The arcade hit comes to NES. Save Marian from the Black Warriors.',
    genre: 'Action',
  },
  {
    id: 'ghostsngoblins',
    title: 'Ghosts \'n Goblins',
    romUrl: '/roms/ghosts_n_goblins.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co20b0.jpg',
    description: 'Notoriously difficult platformer. Save the princess from the demon king.',
    genre: 'Action',
  },

  // 2. 冒险/RPG类
  {
    id: 'zelda',
    title: 'The Legend of Zelda',
    romUrl: '/roms/zelda.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7b.jpg',
    description: 'It\'s dangerous to go alone! Take this. The first game in the legendary series.',
    genre: 'Adventure',
  },
  {
    id: 'finalfantasy',
    title: 'Final Fantasy',
    romUrl: '/roms/final_fantasy.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co209x.jpg',
    description: 'Restore the light to the four orbs and save the world.',
    genre: 'RPG',
  },
  {
    id: 'dragonquest',
    title: 'Dragon Quest',
    romUrl: '/roms/dragon_quest.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co20al.jpg',
    description: 'The grandfather of JRPGs. Defeat the Dragonlord.',
    genre: 'RPG',
  },
  {
    id: 'earthbound',
    title: 'EarthBound Beginnings (Mother)',
    romUrl: '/roms/mother.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x79.jpg',
    description: 'A quirky RPG set in modern times. Also known as EarthBound Zero.',
    genre: 'RPG',
  },

  // 3. 益智/策略类
  {
    id: 'tetris',
    title: 'Tetris',
    romUrl: '/roms/tetris.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7c.jpg',
    description: 'The addictive puzzle game. Clear lines and score points.',
    genre: 'Puzzle',
  },
  {
    id: 'bomberman',
    title: 'Bomberman',
    romUrl: '/roms/bomberman.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co20a5.jpg',
    description: 'Bomb your way through mazes and enemies.',
    genre: 'Strategy',
  },
  {
    id: 'drmario',
    title: 'Dr. Mario',
    romUrl: '/roms/dr_mario.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x76.jpg',
    description: 'Match colors to destroy viruses.',
    genre: 'Puzzle',
  },

  // 4. 体育/竞速类
  {
    id: 'excitebike',
    title: 'Excitebike',
    romUrl: '/roms/excitebike.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co20b9.jpg',
    description: 'Motocross racing with a track editor.',
    genre: 'Racing',
  },
  {
    id: 'baseball',
    title: 'Baseball',
    romUrl: '/roms/baseball.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co20a2.jpg',
    description: 'Simple but fun baseball simulation.',
    genre: 'Sports',
  },
  {
    id: 'punchout',
    title: 'Punch-Out!!',
    romUrl: '/roms/punch_out.nes',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7a.jpg',
    description: 'Boxing game featuring Little Mac.',
    genre: 'Sports',
  },
];
