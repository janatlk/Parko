REGIONS = [
    'Баткен',
    'Чуй',
    'Иссык-Куль',
    'Джалал-Абад',
    'Бишкек',
    'Ош',
]

FUEL_TYPES = [
    'Бензин',
    'Дизель',
    'Газ',
    'Газ/Бензин',
]

VEHICLE_TYPES = [
    'Легковой',
    'Грузовой',
    'Специальный',
]

CAR_BRANDS = [
    'Toyota', 'Volkswagen', 'Ford', 'Honda', 'Hyundai',
    'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz', 'Kia',
    'Audi', 'Tesla', 'Lexus', 'Mazda', 'Subaru',
    'Jeep', 'Renault', 'Peugeot', 'Mitsubishi', 'Suzuki',
    'Volvo', 'Land Rover', 'Jaguar', 'Fiat', 'Dodge',
    'GMC', 'Chrysler', 'Cadillac', 'Acura', 'Infiniti',
    'Porsche', 'Mini', 'Alfa Romeo', 'Genesis', 'Buick',
    'Ram', 'Seat', 'Skoda', 'Citroën', 'Saab',
    'Opel', 'Holden', 'Isuzu', 'Hummer', 'Lincoln',
    'Maserati', 'Bentley', 'Rolls-Royce', 'Aston Martin', 'Ferrari',
    'Lamborghini', 'McLaren', 'Bugatti', 'Pagani', 'Koenigsegg',
    'ГАЗ', 'Lada', 'Специальный',
]


def to_choices(items: list[str]) -> list[dict]:
    return [{'value': v, 'label': v} for v in items]
