/* eslint-disable no-console */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB, sequelize } from '../config/database';
import {
  User,
  Property,
  TenantAssignment,
  Payment,
  Invoice,
  Incident,
  Notification,
} from '../models';

const seedData = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('📦 Conectado a Postgres para seed...');

    const shouldReset = process.argv.includes('--reset');
    if (shouldReset) {
      console.log('🗑️  Limpiando base de datos...');
      await Promise.all([
        User.deleteMany({}),
        Property.deleteMany({}),
        TenantAssignment.deleteMany({}),
        Payment.deleteMany({}),
        Invoice.deleteMany({}),
        Incident.deleteMany({}),
        Notification.deleteMany({}),
      ]);
      console.log('✅ Base de datos limpia.');
    }

    // ── Propietarios ──
    console.log('👤 Creando propietarios...');

    const owner1: any = await User.create({
      fullName: 'Carlos García López',
      email: 'carlos@demo.com',
      password: '123456',
      role: 'owner',
      phone: '+34 612 345 678',
    });

    const owner2: any = await User.create({
      fullName: 'María Fernández Ruiz',
      email: 'maria@demo.com',
      password: '123456',
      role: 'owner',
      phone: '+34 623 456 789',
    });

    // ── Propiedades ──
    console.log('🏠 Creando propiedades...');
    const properties: any[] = await Property.insertMany([
      {
        owner: owner1._id,
        name: 'Piso Centro Valencia',
        address: {
          street: 'Calle Colón 42, 3ºA',
          city: 'Valencia',
          postalCode: '46004',
          country: 'España',
        },
        type: 'apartment',
        monthlyRent: 850,
        bedrooms: 3,
        bathrooms: 2,
        squareMeters: 95,
        description: 'Piso luminoso en el centro de Valencia, reformado, con terraza.',
      },
      {
        owner: owner1._id,
        name: 'Estudio Ruzafa',
        address: {
          street: 'Calle Cuba 18, Bajo',
          city: 'Valencia',
          postalCode: '46006',
          country: 'España',
        },
        type: 'studio',
        monthlyRent: 550,
        bedrooms: 1,
        bathrooms: 1,
        squareMeters: 40,
        description: 'Estudio moderno en el barrio de Ruzafa, ideal para una persona.',
      },
      {
        owner: owner1._id,
        name: 'Casa Playa Malvarrosa',
        address: {
          street: 'Paseo Marítimo 15',
          city: 'Valencia',
          postalCode: '46011',
          country: 'España',
        },
        type: 'house',
        monthlyRent: 1200,
        bedrooms: 4,
        bathrooms: 2,
        squareMeters: 150,
        description: 'Casa frente al mar con jardín privado.',
      },
      {
        owner: owner2._id,
        name: 'Ático Eixample',
        address: {
          street: 'Gran Vía Marqués del Turia 65, 8º',
          city: 'Valencia',
          postalCode: '46005',
          country: 'España',
        },
        type: 'apartment',
        monthlyRent: 1100,
        bedrooms: 2,
        bathrooms: 2,
        squareMeters: 85,
        description: 'Ático con vistas panorámicas y terraza privada.',
      },
      {
        owner: owner2._id,
        name: 'Local Comercial Benimaclet',
        address: {
          street: 'Calle Barón de San Petrillo 9',
          city: 'Valencia',
          postalCode: '46020',
          country: 'España',
        },
        type: 'commercial',
        monthlyRent: 700,
        bedrooms: 0,
        bathrooms: 1,
        squareMeters: 60,
        description: 'Local comercial en zona con mucho tránsito peatonal.',
      },
    ]);

    // ── Inquilinos ──
    console.log('🧑‍🤝‍🧑 Creando inquilinos...');
    const tenants: any[] = [];
    const tenantData: [string, string, string, string][] = [
      ['Ana Martínez Sánchez', 'ana@demo.com', '+34 634 567 890', owner1._id],
      ['Pedro Jiménez Torres', 'pedro@demo.com', '+34 645 678 901', owner1._id],
      ['Laura Rodríguez Gómez', 'laura@demo.com', '+34 656 789 012', owner1._id],
      ['Miguel Ángel Díaz', 'miguel@demo.com', '+34 667 890 123', owner2._id],
      ['Sofia Navarro Pérez', 'sofia@demo.com', '+34 678 901 234', owner2._id],
    ];

    for (const [name, email, phone, registeredBy] of tenantData) {
      const t = await User.create({
        fullName: name,
        email,
        password: '123456',
        role: 'tenant',
        phone,
        registeredBy,
      });
      tenants.push(t);
    }

    // ── Asignaciones ──
    console.log('🔗 Asignando inquilinos a propiedades...');
    await TenantAssignment.insertMany([
      { tenant: tenants[0]._id, property: properties[0]._id, owner: owner1._id },
      { tenant: tenants[1]._id, property: properties[0]._id, owner: owner1._id },
      { tenant: tenants[2]._id, property: properties[1]._id, owner: owner1._id },
      { tenant: tenants[3]._id, property: properties[3]._id, owner: owner2._id },
      { tenant: tenants[4]._id, property: properties[2]._id, owner: owner1._id },
    ]);

    // ── Pagos ──
    console.log('💰 Creando pagos de ejemplo...');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    await Payment.insertMany([
      {
        tenant: tenants[0]._id,
        property: properties[0]._id,
        owner: owner1._id,
        amount: 850,
        month: prevMonth,
        year: prevYear,
        dueDate: new Date(prevYear, prevMonth - 1, 5),
        paidDate: new Date(prevYear, prevMonth - 1, 3),
        status: 'paid',
        paymentMethod: 'transfer',
      },
      {
        tenant: tenants[0]._id,
        property: properties[0]._id,
        owner: owner1._id,
        amount: 850,
        month: currentMonth,
        year: currentYear,
        dueDate: new Date(currentYear, currentMonth - 1, 5),
        status: 'pending',
      },
      {
        tenant: tenants[1]._id,
        property: properties[0]._id,
        owner: owner1._id,
        amount: 850,
        month: currentMonth,
        year: currentYear,
        dueDate: new Date(currentYear, currentMonth - 1, 1),
        status: 'overdue',
      },
      {
        tenant: tenants[2]._id,
        property: properties[1]._id,
        owner: owner1._id,
        amount: 550,
        month: currentMonth,
        year: currentYear,
        dueDate: new Date(currentYear, currentMonth - 1, 5),
        paidDate: new Date(currentYear, currentMonth - 1, 4),
        status: 'paid',
        paymentMethod: 'bizum',
      },
      {
        tenant: tenants[3]._id,
        property: properties[3]._id,
        owner: owner2._id,
        amount: 1100,
        month: currentMonth,
        year: currentYear,
        dueDate: new Date(currentYear, currentMonth - 1, 1),
        status: 'overdue',
      },
      {
        tenant: tenants[4]._id,
        property: properties[2]._id,
        owner: owner1._id,
        amount: 1200,
        month: currentMonth,
        year: currentYear,
        dueDate: new Date(currentYear, currentMonth - 1, 5),
        paidDate: new Date(currentYear, currentMonth - 1, 5),
        status: 'paid',
        paymentMethod: 'transfer',
      },
    ]);

    // ── Facturas ──
    console.log('📄 Creando facturas de suministros...');
    await Invoice.insertMany([
      {
        property: properties[0]._id,
        owner: owner1._id,
        type: 'water',
        amount: 45.3,
        periodStart: { month: currentMonth, year: currentYear },
        periodEnd: { month: currentMonth, year: currentYear },
        isPaid: false,
      },
      {
        property: properties[0]._id,
        owner: owner1._id,
        type: 'electricity',
        amount: 78.5,
        periodStart: { month: currentMonth, year: currentYear },
        periodEnd: { month: currentMonth, year: currentYear },
        isPaid: false,
      },
      {
        property: properties[0]._id,
        owner: owner1._id,
        type: 'gas',
        amount: 32.0,
        periodStart: { month: currentMonth, year: currentYear },
        periodEnd: { month: currentMonth, year: currentYear },
        isPaid: true,
        paidDate: new Date(currentYear, currentMonth - 1, 15),
      },
      {
        property: properties[1]._id,
        owner: owner1._id,
        type: 'electricity',
        amount: 42.8,
        periodStart: { month: currentMonth, year: currentYear },
        periodEnd: { month: currentMonth, year: currentYear },
        isPaid: false,
      },
      {
        property: properties[1]._id,
        owner: owner1._id,
        type: 'internet',
        amount: 35.0,
        periodStart: { month: currentMonth, year: currentYear },
        periodEnd: { month: currentMonth, year: currentYear },
        isPaid: true,
        paidDate: new Date(currentYear, currentMonth - 1, 10),
      },
      {
        property: properties[2]._id,
        owner: owner1._id,
        type: 'water',
        amount: 55.0,
        periodStart: { month: currentMonth, year: currentYear },
        periodEnd: { month: currentMonth, year: currentYear },
        isPaid: false,
      },
      {
        property: properties[3]._id,
        owner: owner2._id,
        type: 'community',
        amount: 120.0,
        periodStart: { month: currentMonth, year: currentYear },
        periodEnd: { month: currentMonth, year: currentYear },
        isPaid: true,
        paidDate: new Date(currentYear, currentMonth - 1, 1),
      },
    ]);

    // ── Incidencias ──
    console.log('⚠️  Creando incidencias...');
    await Incident.insertMany([
      {
        tenant: tenants[0]._id,
        property: properties[0]._id,
        owner: owner1._id,
        title: 'Fuga de agua en el baño',
        description:
          'Hay una fuga debajo del lavabo del baño principal. El agua gotea constantemente y está empezando a dañar el suelo.',
        type: 'plumbing',
        priority: 'high',
        status: 'in_progress',
        ownerNotes: 'Fontanero contactado, irá el jueves.',
      },
      {
        tenant: tenants[1]._id,
        property: properties[0]._id,
        owner: owner1._id,
        title: 'Enchufe habitación no funciona',
        description:
          'El enchufe de la pared derecha de la habitación principal no tiene corriente.',
        type: 'electrical',
        priority: 'medium',
        status: 'open',
      },
      {
        tenant: tenants[2]._id,
        property: properties[1]._id,
        owner: owner1._id,
        title: 'Caldera no enciende',
        description: 'La caldera no arranca desde ayer. No hay agua caliente.',
        type: 'heating',
        priority: 'urgent',
        status: 'open',
      },
      {
        tenant: tenants[3]._id,
        property: properties[3]._id,
        owner: owner2._id,
        title: 'Persiana atascada',
        description: 'La persiana del salón se ha atascado a medio camino y no sube ni baja.',
        type: 'structural',
        priority: 'low',
        status: 'resolved',
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        ownerNotes: 'Reparada por el mantenimiento del edificio.',
      },
      {
        tenant: tenants[4]._id,
        property: properties[2]._id,
        owner: owner1._id,
        title: 'Humedad en pared cocina',
        description:
          'Ha aparecido una mancha de humedad en la pared de la cocina junto a la ventana.',
        type: 'structural',
        priority: 'medium',
        status: 'open',
      },
    ]);

    // ── Notificaciones ──
    console.log('🔔 Creando notificaciones...');
    await Notification.insertMany([
      {
        recipient: owner1._id,
        type: 'incident',
        title: 'Nueva incidencia',
        message: 'Ana ha reportado una fuga de agua en Piso Centro Valencia.',
      },
      {
        recipient: owner1._id,
        type: 'payment',
        title: 'Pago recibido',
        message: 'Laura ha pagado el alquiler de febrero: 550€.',
      },
      {
        recipient: owner1._id,
        type: 'incident',
        title: 'Nueva incidencia',
        message: 'Pedro reporta un enchufe que no funciona.',
      },
      {
        recipient: owner1._id,
        type: 'reminder',
        title: 'Pago retrasado',
        message: 'Pedro lleva 4 días de retraso en el pago.',
      },
      {
        recipient: tenants[0]._id,
        type: 'incident',
        title: 'Actualización de incidencia',
        message: 'Tu incidencia "Fuga de agua" está en progreso. Fontanero irá el jueves.',
      },
    ]);

    console.log('\n✅ ¡Seed completado exitosamente!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Credenciales de prueba:');
    console.log('  Propietario 1: carlos@demo.com / 123456');
    console.log('  Propietario 2: maria@demo.com  / 123456');
    console.log('  Inquilina:     ana@demo.com    / 123456');
    console.log('  Inquilino:     pedro@demo.com  / 123456');
    console.log('  Inquilina:     laura@demo.com  / 123456');
    console.log('  Inquilino:     miguel@demo.com / 123456');
    console.log('  Inquilina:     sofia@demo.com  / 123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await sequelize.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error en seed:', error.message);
    try {
      await sequelize.close();
    } catch (_e) {
      // ignore
    }
    process.exit(1);
  }
};

seedData();
