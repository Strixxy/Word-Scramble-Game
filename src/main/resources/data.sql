-- Only seeds the database if the word table is empty (safe to run on every restart)
INSERT INTO word (original, category, hint1, hint2)
SELECT * FROM (VALUES
    ROW('elephant',   'Animals',     'Largest land animal',        'Has a trunk'),
    ROW('dolphin',    'Animals',     'Lives in the ocean',         'Very intelligent mammal'),
    ROW('giraffe',    'Animals',     'Tallest animal on earth',    'Has a very long neck'),
    ROW('penguin',    'Animals',     'Cannot fly',                 'Lives in Antarctica'),
    ROW('cheetah',    'Animals',     'Fastest land animal',        'Has spots'),
    ROW('kangaroo',   'Animals',     'Has a pouch',                'Native to Australia'),
    ROW('crocodile',  'Animals',     'Ancient reptile',            'Has sharp teeth'),
    ROW('butterfly',  'Animals',     'Has colorful wings',         'Was once a caterpillar'),

    ROW('cricket',    'Sports',      'Popular in India',           'Played with a bat and ball'),
    ROW('football',   'Sports',      'Most popular sport globally', 'Played with 11 players per team'),
    ROW('badminton',  'Sports',      'Uses a shuttlecock',         'Played with a racket'),
    ROW('swimming',   'Sports',      'Done in water',              'Michael Phelps is famous for it'),
    ROW('marathon',   'Sports',      'A long distance race',       '42.195 km long'),
    ROW('wrestling',  'Sports',      'A combat sport',             'Involves grappling'),
    ROW('archery',    'Sports',      'Uses a bow',                 'Aim at a target'),

    ROW('keyboard',   'Technology',  'Input device',               'Has QWERTY layout'),
    ROW('monitor',    'Technology',  'Output device',              'You look at this'),
    ROW('browser',    'Technology',  'Used to surf the internet',  'Chrome and Firefox are examples'),
    ROW('compiler',   'Technology',  'Converts code',              'Turns source code to machine code'),
    ROW('database',   'Technology',  'Stores data',                'MySQL is one example'),
    ROW('internet',   'Technology',  'Global network',             'Connects billions of devices'),
    ROW('software',   'Technology',  'Intangible programs',        'Opposite of hardware'),

    ROW('mango',      'Fruits',      'King of fruits',             'Yellow and sweet'),
    ROW('banana',     'Fruits',      'Yellow fruit',               'Monkeys love it'),
    ROW('orange',     'Fruits',      'Citrus fruit',               'Same name as the color'),
    ROW('pineapple',  'Fruits',      'Tropical fruit',             'Has a spiky exterior'),
    ROW('watermelon', 'Fruits',      'Mostly water',               'Red inside, green outside'),
    ROW('strawberry', 'Fruits',      'Red and small',              'Used in milkshakes'),

    ROW('python',     'Programming', 'A scripting language',       'Named after a comedy show'),
    ROW('variable',   'Programming', 'Stores a value',             'Has a name and a type'),
    ROW('function',   'Programming', 'Reusable block of code',     'Takes inputs, returns output'),
    ROW('boolean',    'Programming', 'True or false',              'Named after George Boole'),
    ROW('iterator',   'Programming', 'Loops through items',        'Used in for-each loops')
) AS tmp (original, category, hint1, hint2)
WHERE NOT EXISTS (SELECT 1 FROM word LIMIT 1);
