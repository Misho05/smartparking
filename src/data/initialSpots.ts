import { ParkingSpot } from '../types';

export const generateInitialSpots = (): ParkingSpot[] => {
  return [
    {
      id: 'A',
      name: 'A პარკინგი (თანამშრომლების)',
      zoneName: 'A სექტორი • თანამშრომლების გამოყოფილი სივრცე',
      number: 1,
      type: 'employee',
      status: 'occupied',
      pricePerHour: 0.0,
      floor: 1,
      isEmployeeOnly: true,
      features: [
        'კომპანიის თანამშრომლებისთვის (Staff Only)',
        'ავტომატური ANPR კამერით ამოცნობა და დაშვება',
        'უფასო პარკირება თანამშრომელთა ბაზის საშვით',
        'CCTV ვიდეო მეთვალყურეობა 24/7',
      ],
      occupiedBy: {
        plateNumber: 'EMP-777-GE',
        vehicleType: 'sedan',
        driverName: 'დავით კობახიძე (მენეჯმენტი)',
        expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(),
        isEmployee: true,
      },
    },
    {
      id: 'B',
      name: 'B პარკინგი (ფასიანი პარკინგი)',
      zoneName: 'B სექტორი • ფასიანი საპარკინგე სივრცე კლიენტებისთვის',
      number: 2,
      type: 'paid',
      status: 'available',
      pricePerHour: 1.0,
      floor: 1,
      isEmployeeOnly: false,
      features: [
        'სატარიფო გეგმა: 1 სთ = 1.00 ₾ | 3 სთ = 2.00 ₾ | 24 სთ = 5.00 ₾',
        'წინასწარი ონლაინ დაჯავშნა და გადახდა',
        'კამერით ნომრის ავტომატური ამოცნობა და ბარიერის გახსნა',
        'ციფრული QR საშვი და 24/7 დაცული სივრცე',
      ],
    },
  ];
};
