const printer = require('./printer_helper');

console.log('Testing printer_helper...');
console.log('Is Mock Mode?', printer.isMock);

console.log('Initial Status:', printer.getStatus());

console.log('Listing Printers...');
printer.listPrinters().then(printers => {
    console.log('Available printers:', printers);

    console.log('Connecting to a test settings...');
    const connResult = printer.connect(printer.isMock ? 'MOCK_USB_01' : 'NET,127.0.0.1');
    console.log('Connection Result:', connResult);

    console.log('Connected Status:', printer.getStatus());

    console.log('Testing receipt print...');
    const printResult = printer.printReceipt({
        id: 'PL-5582-9018',
        name: 'Johnny Doe',
        email: 'johnny@petalife.com',
        tier: 'Platinum VIP',
        points: 24500,
        pets: [
            {
                name: 'Rocky',
                breed: 'Siberian Husky',
                age: '2 years',
                microchip: '981022300456128',
                nextVaccine: '2026-11-20'
            },
            {
                name: 'Luna',
                breed: 'Persian Cat',
                age: '1 year',
                microchip: '981022300998877',
                nextVaccine: '2027-02-14'
            }
        ]
    });
    console.log('Print Result:', printResult);

    console.log('Disconnecting...');
    const disResult = printer.disconnect();
    console.log('Disconnect Result:', disResult);

    console.log('Final Status:', printer.getStatus());
});
