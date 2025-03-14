import itertools
import random

modifiers = [
    "X", "Pro", "21", "42", "47", "99", "88", "1337", "666", "2023", "999", "ZT", "FX", "OG", 
    "HD", "4K", "VIII", "XL", "MK", "ULTRA", "TV", "LP", "RX", "TX",
    "V2", "III", "XX", "XP", "2K", "8K", "10K", "AE", "NX", "QM",
    "SD", "HD", "4D", "3D", "VR", "AR", "AI", "NV", "QS", "360", "QM",
    "MVP", "FTW", "GG", "XOXO", "07", "22", "13", "XXX", "69"
] #"XOXO", "♥", "♡", "♀", "★", "XX", "X", "_", "~", "✨",


def add_special_chars(name):
    replacements = {
        'a': '@', 'A': '4',
        's': '$', 'S': '5',
        'e': '3', 'E': '3',
        'i': '!', 'I': '1',
        'o': '0', 'O': '0',
        't': '7', 'g': '9',
        'b': '8'
    }
    return ''.join([replacements.get(c, c) if random.random() < 0.3 else c for c in name])

def  male_nick_generator():
    # Расширенные списки (40 элементов в каждом)
    prefixes = [
        "Cyber", "Shadow", "Stealth", "Iron", "Phantom", "Ghost", "Dark", "Net", "Blood", "Zero",
        "Night", "Wolf", "Death", "Soul", "Void", "Nova", "Alpha", "Omega", "Pixel", "Digital",
        "Raven", "Storm", "Blade", "Chaos", "Crimson", "Demon", "Dragon", "Frost", "Glitch", "Havoc",
        "Inferno", "Jagged", "Killer", "Lunar", "Mirage", "Neon", "Onyx", "Pyro", "Quantum", "Rogue", 
        "Silent", "Rapid", "Blazing", "Eagle", "Mercenary", "Toxic", "Arc", "Anton", "Max", "Maax",
        "Joe", "Roma", "Tommy", "Tom", "Slavon", "Toxa", "Toska", "Norman", "Grom", "Nerv", "Zlo"
        ""
    ]

    suffixes = [
        "Hunter", "Killer", "Striker", "Warden", "Sniper", "Reaper", "Wolf", "Viper", "Gamer", "Soldier",
        "Slayer", "Master", "Destroyer", "Hunter", "Breaker", "Walker", "Rider", "King", "Queen", "Lord",
        "Surgeon", "Headshot", "Shooter", "Bandit", "Crusher", "Punisher", "Raider", "Hunter", "Merc", "Agent",
        "Ninja", "Samurai", "Titan", "Vandal", "Warrior", "Wraith", "Zealot", "Berserk", "Marauder", "Overlord",
        "Phoenix", "Neo", "Wick", "Spartan", "Raiden", "Guardian", "Yokai", "Shinobi", "Samurai", "Legacy", "Chief",
        "Sadko", "Nerevaren", "Slark", "Druid"
    ]

    templates = [
        lambda: f"{random.choice(prefixes)}{random.choice(suffixes)}",
        lambda: f"The{random.choice(prefixes)}{random.choice(suffixes)}",
        lambda: f"{random.choice(['Mr', 'Dr', 'Lord', 'Sir', 'Captain', 'General', 'Major'])}{random.choice(suffixes)}",
        lambda: f"{random.choice(prefixes)}{random.choice(['Headshot', 'NoScope', 'CampKing', 'OneTap', '360'])}",
        lambda: f"{random.choice(suffixes)}{random.choice(modifiers)}",
        lambda: f"{random.choice(['xX', 'XX', ''])}{random.choice(prefixes)}{random.choice(suffixes)}{random.choice(modifiers)}{random.choice(['Xx', 'XX', ''])}",
        lambda: f"{random.choice(prefixes)}-{random.choice(suffixes)}",
        lambda: f"{random.choice(prefixes)}_{random.choice(suffixes)}",
        lambda: f"{random.choice(['Deadly', 'Lethal', 'Epic', 'Pro', 'God'])}{random.choice(suffixes)}",
        lambda: f"{random.choice(prefixes)}{random.choice(['', str(random.randint(1, 999))])}"
    ]

    nicknames = set()

    # Основные комбинации
    for combination in itertools.product(prefixes, suffixes):
        nick = "".join(combination)
        if random.random() > 0.4:
            nick += random.choice(modifiers)
        if random.random() > 0.5:
            nick = add_special_chars(nick)
        nicknames.add(nick)

    # Дополнительные варианты
    while len(nicknames) < 5000:
        nick = random.choice(templates)()
        if random.random() > 0.6:
            nick = add_special_chars(nick)
        nicknames.add(nick)

    return nicknames

def female_nick_generator():
    female_prefixes = [
        "Pink", "Luna", "Angel", "Diva", "Candy", "Bunny", "Princess", "Queen", 
        "Cherry", "Star", "Sugar", "Cyber", "Steel", "Miss", "Lady", "Secret", 
        "Velvet", "Blossom", "Crimson", "Neon", "Sapphire", "Violet", "Ruby", 
        "Snow", "Lovely", "Choco", "Goddess", "Moon", "Diamond", "Fairy"
    ]
    
    female_suffixes = [
        "Kitten", "Doll", "Butterfly", "Sparkle", "Flower", "Queen", "Witch", 
        "Shadow", "Fox", "Vixen", "Rose", "Unicorn", "Mermaid", "Babe", "Goddess", 
        "Charm", "Cupcake", "Kitty", "Peach", "Dream", "Venus", "Sky", "Belle", 
        "Pixel", "Lily", "Star", "Berry", "Crystal", "Raven", "Phoenix", "Sofi", "Anna",
        "Mia", "Margo", "Iv", "Kroha", "Devka", "Zlaya", "Zaya"
    ]
    
    
    templates = [
        lambda: f"{random.choice(female_prefixes)}{random.choice(female_suffixes)}",
        lambda: f"Miss{random.choice(female_suffixes)}",
        lambda: f"xX{random.choice(female_prefixes)}_{random.choice(female_suffixes)}Xx",
#        lambda: f"{random.choice(female_prefixes)}♡{random.choice(female_suffixes)}",
        lambda: f"{random.choice(['Queen', 'Lady', 'Princess'])}Of{random.choice(['Headshots', 'CS', 'War'])}",
        lambda: f"{random.choice(female_prefixes)}{random.choice(['Killer', 'Slayer', 'Sniper'])}",
        lambda: f"{random.choice(female_prefixes)}_{random.choice(female_suffixes)}{random.choice(modifiers)}",
        lambda: f"{random.choice(female_prefixes)}-{random.choice(female_suffixes)}"
    ]
    
    nicknames = set()
    
    # Основные комбинации
    for _ in range(80):
        nick = random.choice(templates)()
        if random.random() > 0.7:
            nick = nick.replace('a', '@').replace('i', '!').replace('e', '3').replace('s', '$')
        nicknames.add(nick)
    
    # Дополнение уникальными вариантами
    while len(nicknames) < 100:
        combo = (
            f"{random.choice(female_prefixes)}"
            f"{random.choice(['', random.choice(modifiers)])}"
            f"{random.choice(['', '_Girl', '_Woman', '_Diva'])}"
        )
        if random.random() > 0.5:
            combo += random.choice(['', str(random.randint(1, 99))])
        nicknames.add(combo)
    
    return nicknames


def generate_nicknames():
    # Мужские ники 
    nicknames = male_nick_generator()
    # Добавляем женские ники
    female_nicks = female_nick_generator()
    nicknames.update(female_nicks)

    return list(nicknames)

if __name__ == '__main__':
    all_nicks = generate_nicknames()
    print({name: name for name in all_nicks})
    print(len(all_nicks))


#Str1ke", "De4th", "Cyb3r



