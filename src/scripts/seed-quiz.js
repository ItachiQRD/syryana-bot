import db from '../db.js';

const questions = [
  { q: 'Quelle est la capitale de la France ?', c: ['Lyon', 'Paris', 'Marseille', 'Bordeaux'], a: 1, cat: 'géographie' },
  { q: 'Combien de continents compte-t-on traditionnellement ?', c: ['5', '6', '7', '8'], a: 2, cat: 'géographie' },
  { q: 'Qui a peint la Joconde ?', c: ['Michel-Ange', 'Léonard de Vinci', 'Raphaël', 'Botticelli'], a: 1, cat: 'art' },
  { q: 'En quelle année a eu lieu la Révolution française ?', c: ['1789', '1799', '1815', '1848'], a: 0, cat: 'histoire' },
  { q: 'Quel est le plus grand océan du monde ?', c: ['Atlantique', 'Indien', 'Arctique', 'Pacifique'], a: 3, cat: 'géographie' },
  { q: 'Quelle planète est surnommée la planète rouge ?', c: ['Vénus', 'Mars', 'Jupiter', 'Saturne'], a: 1, cat: 'sciences' },
  { q: 'Combien de joueurs composent une équipe de football sur le terrain ?', c: ['9', '10', '11', '12'], a: 2, cat: 'sport' },
  { q: 'Quel langage est principalement utilisé pour le web côté navigateur ?', c: ['Python', 'JavaScript', 'C++', 'Ruby'], a: 1, cat: 'tech' },
  { q: 'Quel animal est le plus rapide sur terre ?', c: ['Lion', 'Guépard', 'Antilope', 'Cheval'], a: 1, cat: 'nature' },
  { q: 'Dans quel pays se trouve la tour de Pise ?', c: ['Espagne', 'Italie', 'Grèce', 'Portugal'], a: 1, cat: 'géographie' },
  { q: 'Quel est l\'élément chimique dont le symbole est O ?', c: ['Or', 'Osmium', 'Oxygène', 'Ozone'], a: 2, cat: 'sciences' },
  { q: 'Qui a écrit « Les Misérables » ?', c: ['Balzac', 'Zola', 'Victor Hugo', 'Flaubert'], a: 2, cat: 'littérature' },
  { q: 'Quelle est la monnaie du Japon ?', c: ['Won', 'Yuan', 'Yen', 'Ringgit'], a: 2, cat: 'culture' },
  { q: 'Combien de côtés a un hexagone ?', c: ['5', '6', '7', '8'], a: 1, cat: 'maths' },
  { q: 'Quel pays a inventé les Jeux olympiques antiques ?', c: ['Rome', 'Grèce', 'Égypte', 'Turquie'], a: 1, cat: 'histoire' },
  { q: 'Quel est le mammifère le plus grand ?', c: ['Éléphant', 'Baleine bleue', 'Girafe', 'Requin'], a: 1, cat: 'nature' },
  { q: 'En musique, combien de notes dans une octave (gamme majeure) ?', c: ['5', '6', '7', '8'], a: 3, cat: 'musique' },
  { q: 'Quel gaz les plantes absorbent-elles pour la photosynthèse ?', c: ['Oxygène', 'Azote', 'Dioxyde de carbone', 'Hélium'], a: 2, cat: 'sciences' },
  { q: 'Quelle ville est surnommée la Grosse Pomme ?', c: ['Los Angeles', 'Chicago', 'New York', 'Boston'], a: 2, cat: 'culture' },
  { q: 'Qui a développé la théorie de la relativité ?', c: ['Newton', 'Einstein', 'Galilée', 'Hawking'], a: 1, cat: 'sciences' },
  { q: 'Quel est le plus long fleuve du monde ?', c: ['Nil', 'Amazone', 'Mississippi', 'Yangtsé'], a: 1, cat: 'géographie' },
  { q: 'Combien de minutes dure un match de basketball NBA par quart-temps ?', c: ['10', '12', '15', '20'], a: 1, cat: 'sport' },
  { q: 'Quel super-héros est aussi connu sous le nom de Bruce Wayne ?', c: ['Superman', 'Batman', 'Spider-Man', 'Iron Man'], a: 1, cat: 'pop culture' },
  { q: 'Quelle est la langue la plus parlée au monde (langue maternelle) ?', c: ['Anglais', 'Espagnol', 'Mandarin', 'Hindi'], a: 2, cat: 'culture' },
  { q: 'Quel organe pompe le sang dans le corps humain ?', c: ['Poumon', 'Foie', 'Cœur', 'Rein'], a: 2, cat: 'sciences' },
  { q: 'Dans quel pays se trouve le Machu Picchu ?', c: ['Bolivie', 'Chili', 'Pérou', 'Colombie'], a: 2, cat: 'géographie' },
  { q: 'Quel est le symbole chimique de l\'or ?', c: ['Ag', 'Au', 'Fe', 'Cu'], a: 1, cat: 'sciences' },
  { q: 'Combien de faces a un dé classique ?', c: ['4', '6', '8', '12'], a: 1, cat: 'maths' },
  { q: 'Quel réseau social appartient à Meta ?', c: ['TikTok', 'Instagram', 'Snapchat', 'LinkedIn'], a: 1, cat: 'tech' },
  { q: 'Quelle saison commence en décembre dans l\'hémisphère nord ?', c: ['Automne', 'Hiver', 'Printemps', 'Été'], a: 1, cat: 'général' },
];

const insert = db.prepare(`
  INSERT INTO quiz_questions (question, choices, correct_index, category)
  VALUES (?, ?, ?, ?)
`);

const count = db.prepare('SELECT COUNT(*) as n FROM quiz_questions').get().n;
if (count > 0) {
  console.log(`Base déjà remplie (${count} questions). Rien à faire.`);
  process.exit(0);
}

const run = db.transaction((items) => {
  for (const item of items) {
    insert.run(item.q, JSON.stringify(item.c), item.a, item.cat);
  }
});

run(questions);
console.log(`✅ ${questions.length} questions ajoutées pour Syryana !`);
