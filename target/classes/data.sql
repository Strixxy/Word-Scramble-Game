-- Clears old data on restart so new columns (like difficulty) apply
DELETE FROM word;

INSERT INTO word (original, category, difficulty, hint1, hint2)
SELECT * FROM (VALUES
    -- ANIMALS
    ROW('cat',        'Animals', 'EASY',   'Popular pet',                'Meows'),
    ROW('dog',        'Animals', 'EASY',   'Man''s best friend',         'Barks'),
    ROW('lion',       'Animals', 'EASY',   'King of the jungle',         'Has a mane'),
    ROW('tiger',      'Animals', 'EASY',   'Big cat',                    'Has stripes'),
    ROW('elephant',   'Animals', 'MEDIUM', 'Largest land animal',        'Has a trunk'),
    ROW('dolphin',    'Animals', 'MEDIUM', 'Lives in the ocean',         'Very intelligent mammal'),
    ROW('giraffe',    'Animals', 'MEDIUM', 'Tallest animal on earth',    'Has a very long neck'),
    ROW('penguin',    'Animals', 'MEDIUM', 'Cannot fly',                 'Lives in Antarctica'),
    ROW('cheetah',    'Animals', 'MEDIUM', 'Fastest land animal',        'Has spots'),
    ROW('kangaroo',   'Animals', 'MEDIUM', 'Has a pouch',                'Native to Australia'),
    ROW('crocodile',  'Animals', 'HARD',   'Ancient reptile',            'Has sharp teeth'),
    ROW('butterfly',  'Animals', 'HARD',   'Has colorful wings',         'Was once a caterpillar'),

    -- SPORTS
    ROW('golf',       'Sports',  'EASY',   'Hit a small ball',           'Into a hole'),
    ROW('polo',       'Sports',  'EASY',   'Played on horses',           'With mallets'),
    ROW('cricket',    'Sports',  'MEDIUM', 'Popular in India',           'Played with a bat and ball'),
    ROW('football',   'Sports',  'MEDIUM', 'Most popular sport globally', 'Played with 11 players per team'),
    ROW('swimming',   'Sports',  'MEDIUM', 'Done in water',              'Michael Phelps is famous for it'),
    ROW('marathon',   'Sports',  'MEDIUM', 'A long distance race',       '42.195 km long'),
    ROW('archery',    'Sports',  'MEDIUM', 'Uses a bow',                 'Aim at a target'),
    ROW('badminton',  'Sports',  'HARD',   'Uses a shuttlecock',         'Played with a racket'),
    ROW('wrestling',  'Sports',  'HARD',   'A combat sport',             'Involves grappling'),

    -- TECHNOLOGY
    ROW('mouse',      'Technology','EASY', 'Input device',               'Points and clicks'),
    ROW('chip',       'Technology','EASY', 'Integrated circuit',         'Silicon wafer'),
    ROW('keyboard',   'Technology','MEDIUM','Input device',              'Has QWERTY layout'),
    ROW('monitor',    'Technology','MEDIUM','Output device',             'You look at this'),
    ROW('browser',    'Technology','MEDIUM','Used to surf the internet', 'Chrome and Firefox are examples'),
    ROW('compiler',   'Technology','MEDIUM','Converts code',             'Turns source code to machine code'),
    ROW('database',   'Technology','MEDIUM','Stores data',               'MySQL is one example'),
    ROW('internet',   'Technology','MEDIUM','Global network',            'Connects billions of devices'),
    ROW('software',   'Technology','MEDIUM','Intangible programs',       'Opposite of hardware'),
    ROW('smartphone', 'Technology','HARD',  'Pocket computer',           'Makes calls too'),

    -- FRUITS
    ROW('plum',       'Fruits',  'EASY',   'Purple fruit',               'Can be dried into a prune'),
    ROW('mango',      'Fruits',  'EASY',   'King of fruits',             'Yellow and sweet'),
    ROW('apple',      'Fruits',  'EASY',   'Keeps the doctor away',      'Red or green'),
    ROW('grape',      'Fruits',  'EASY',   'Grows on vines',             'Used to make wine'),
    ROW('banana',     'Fruits',  'MEDIUM', 'Yellow fruit',               'Monkeys love it'),
    ROW('orange',     'Fruits',  'MEDIUM', 'Citrus fruit',               'Same name as the color'),
    ROW('pineapple',  'Fruits',  'HARD',   'Tropical fruit',             'Has a spiky exterior'),
    ROW('watermelon', 'Fruits',  'HARD',   'Mostly water',               'Red inside, green outside'),
    ROW('strawberry', 'Fruits',  'HARD',   'Red and small',              'Used in milkshakes'),

    -- PROGRAMMING
    ROW('java',       'Programming','EASY', 'Write once, run anywhere',  'Coffee icon'),
    ROW('html',       'Programming','EASY', 'Web structure',             'Tags and elements'),
    ROW('css',        'Programming','EASY', 'Web styling',               'Cascading Style Sheets'),
    ROW('python',     'Programming','MEDIUM','A scripting language',     'Named after a comedy show'),
    ROW('variable',   'Programming','MEDIUM','Stores a value',           'Has a name and a type'),
    ROW('function',   'Programming','MEDIUM','Reusable block of code',   'Takes inputs, returns output'),
    ROW('boolean',    'Programming','MEDIUM','True or false',            'Named after George Boole'),
    ROW('iterator',   'Programming','MEDIUM','Loops through items',      'Used in for-each loops'),
    ROW('polymorphism','Programming','HARD','Many forms',                'Object-oriented concept')
) AS tmp (original, category, difficulty, hint1, hint2);
