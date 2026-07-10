require('dotenv').config()
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 Seeding programs data...')

  // ============================================================
  // 1. SKATING
  // ============================================================
  const skatingCat = await prisma.programCategory.create({
    data: {
      name: 'Skating',
      image: '/skating.png',
    }
  })

  // --- Sun, Wed: Beginners then Advanced ---
  const skatingSunWedBeginners = await prisma.program.create({
    data: {
      categoryId: skatingCat.id,
      name: 'Skating - Beginners (Sun/Wed)',
      description: 'حصص تزلج للمبتدئين كل أحد وأربعاء. أول إيجار سكيت مجاناً ✨ وبعد كدا 40 جنيه للحصة.',
    }
  })
  const sb1_class = await prisma.programOption.create({ data: { programId: skatingSunWedBeginners.id, name: 'حصة واحدة', price: 200, sessionsPerMonth: 1, capacity: 15 } })
  const sb1_4 = await prisma.programOption.create({ data: { programId: skatingSunWedBeginners.id, name: '4 حصص شهرياً', price: 700, sessionsPerMonth: 4, capacity: 15 } })
  const sb1_8 = await prisma.programOption.create({ data: { programId: skatingSunWedBeginners.id, name: '8 حصص شهرياً', price: 1150, sessionsPerMonth: 8, capacity: 15 } })
  const sb1_8offer = await prisma.programOption.create({ data: { programId: skatingSunWedBeginners.id, name: '8 حصص - عرض الافتتاح', price: 1000, sessionsPerMonth: 8, capacity: 15 } })
  for (const optId of [sb1_class.id, sb1_4.id, sb1_8.id, sb1_8offer.id]) {
    await prisma.programSchedule.createMany({
      data: [
        { optionId: optId, dayOfWeek: 0, startTime: '16:00', endTime: '17:30' },
        { optionId: optId, dayOfWeek: 0, startTime: '17:30', endTime: '19:00' },
        { optionId: optId, dayOfWeek: 3, startTime: '16:00', endTime: '17:30' },
        { optionId: optId, dayOfWeek: 3, startTime: '17:30', endTime: '19:00' },
      ]
    })
  }

  const skatingSunWedAdvanced = await prisma.program.create({
    data: {
      categoryId: skatingCat.id,
      name: 'Skating - Advanced (Sun/Wed)',
      description: 'حصص تزلج للمتقدمين كل أحد وأربعاء. أول إيجار سكيت مجاناً ✨ وبعد كدا 40 جنيه للحصة.',
    }
  })
  const sa1_class = await prisma.programOption.create({ data: { programId: skatingSunWedAdvanced.id, name: 'حصة واحدة', price: 200, sessionsPerMonth: 1, capacity: 15 } })
  const sa1_4 = await prisma.programOption.create({ data: { programId: skatingSunWedAdvanced.id, name: '4 حصص شهرياً', price: 700, sessionsPerMonth: 4, capacity: 15 } })
  const sa1_8 = await prisma.programOption.create({ data: { programId: skatingSunWedAdvanced.id, name: '8 حصص شهرياً', price: 1150, sessionsPerMonth: 8, capacity: 15 } })
  const sa1_8offer = await prisma.programOption.create({ data: { programId: skatingSunWedAdvanced.id, name: '8 حصص - عرض الافتتاح', price: 1000, sessionsPerMonth: 8, capacity: 15 } })
  for (const optId of [sa1_class.id, sa1_4.id, sa1_8.id, sa1_8offer.id]) {
    await prisma.programSchedule.createMany({
      data: [
        { optionId: optId, dayOfWeek: 0, startTime: '19:00', endTime: '20:30' },
        { optionId: optId, dayOfWeek: 0, startTime: '20:30', endTime: '22:00' },
        { optionId: optId, dayOfWeek: 3, startTime: '19:00', endTime: '20:30' },
        { optionId: optId, dayOfWeek: 3, startTime: '20:30', endTime: '22:00' },
      ]
    })
  }

  // --- Sat, Thu: Advanced then Beginners ---
  const skatingSatThuAdvanced = await prisma.program.create({
    data: {
      categoryId: skatingCat.id,
      name: 'Skating - Advanced (Sat/Thu)',
      description: 'حصص تزلج للمتقدمين كل سبت وخميس. أول إيجار سكيت مجاناً ✨ وبعد كدا 40 جنيه للحصة.',
    }
  })
  const sa2_class = await prisma.programOption.create({ data: { programId: skatingSatThuAdvanced.id, name: 'حصة واحدة', price: 200, sessionsPerMonth: 1, capacity: 15 } })
  const sa2_4 = await prisma.programOption.create({ data: { programId: skatingSatThuAdvanced.id, name: '4 حصص شهرياً', price: 700, sessionsPerMonth: 4, capacity: 15 } })
  const sa2_8 = await prisma.programOption.create({ data: { programId: skatingSatThuAdvanced.id, name: '8 حصص شهرياً', price: 1150, sessionsPerMonth: 8, capacity: 15 } })
  const sa2_8offer = await prisma.programOption.create({ data: { programId: skatingSatThuAdvanced.id, name: '8 حصص - عرض الافتتاح', price: 1000, sessionsPerMonth: 8, capacity: 15 } })
  for (const optId of [sa2_class.id, sa2_4.id, sa2_8.id, sa2_8offer.id]) {
    await prisma.programSchedule.createMany({
      data: [
        { optionId: optId, dayOfWeek: 6, startTime: '16:00', endTime: '17:30' },
        { optionId: optId, dayOfWeek: 6, startTime: '17:30', endTime: '19:00' },
        { optionId: optId, dayOfWeek: 4, startTime: '16:00', endTime: '17:30' },
        { optionId: optId, dayOfWeek: 4, startTime: '17:30', endTime: '19:00' },
      ]
    })
  }

  const skatingSatThuBeginners = await prisma.program.create({
    data: {
      categoryId: skatingCat.id,
      name: 'Skating - Beginners (Sat/Thu)',
      description: 'حصص تزلج للمبتدئين كل سبت وخميس. أول إيجار سكيت مجاناً ✨ وبعد كدا 40 جنيه للحصة.',
    }
  })
  const sb2_class = await prisma.programOption.create({ data: { programId: skatingSatThuBeginners.id, name: 'حصة واحدة', price: 200, sessionsPerMonth: 1, capacity: 15 } })
  const sb2_4 = await prisma.programOption.create({ data: { programId: skatingSatThuBeginners.id, name: '4 حصص شهرياً', price: 700, sessionsPerMonth: 4, capacity: 15 } })
  const sb2_8 = await prisma.programOption.create({ data: { programId: skatingSatThuBeginners.id, name: '8 حصص شهرياً', price: 1150, sessionsPerMonth: 8, capacity: 15 } })
  const sb2_8offer = await prisma.programOption.create({ data: { programId: skatingSatThuBeginners.id, name: '8 حصص - عرض الافتتاح', price: 1000, sessionsPerMonth: 8, capacity: 15 } })
  for (const optId of [sb2_class.id, sb2_4.id, sb2_8.id, sb2_8offer.id]) {
    await prisma.programSchedule.createMany({
      data: [
        { optionId: optId, dayOfWeek: 6, startTime: '19:00', endTime: '20:30' },
        { optionId: optId, dayOfWeek: 6, startTime: '20:30', endTime: '22:00' },
        { optionId: optId, dayOfWeek: 4, startTime: '19:00', endTime: '20:30' },
        { optionId: optId, dayOfWeek: 4, startTime: '20:30', endTime: '22:00' },
      ]
    })
  }

  // --- Mon, Tue: Kids ---
  const skatingKidsBegSoly = await prisma.program.create({
    data: {
      categoryId: skatingCat.id,
      name: 'Kids Beginners - Coach Soly (Mon)',
      description: 'حصص تزلج للأطفال المبتدئين مع كابتن سولي. أول إيجار سكيت مجاناً ✨',
    }
  })
  const skb1_class = await prisma.programOption.create({ data: { programId: skatingKidsBegSoly.id, name: 'حصة واحدة', price: 200, sessionsPerMonth: 1, capacity: 15 } })
  const skb1_4 = await prisma.programOption.create({ data: { programId: skatingKidsBegSoly.id, name: '4 حصص شهرياً', price: 700, sessionsPerMonth: 4, capacity: 15 } })
  const skb1_8 = await prisma.programOption.create({ data: { programId: skatingKidsBegSoly.id, name: '8 حصص شهرياً', price: 1150, sessionsPerMonth: 8, capacity: 15 } })
  for (const optId of [skb1_class.id, skb1_4.id, skb1_8.id]) {
    await prisma.programSchedule.createMany({
      data: [
        { optionId: optId, dayOfWeek: 1, startTime: '16:00', endTime: '17:30' },
      ]
    })
  }

  const skatingKidsAdvMayar = await prisma.program.create({
    data: {
      categoryId: skatingCat.id,
      name: 'Kids Advanced - Coach Mayar (Mon)',
      description: 'حصص تزلج للأطفال المتقدمين مع كابتن ميار. أول إيجار سكيت مجاناً ✨',
    }
  })
  const ska1_class = await prisma.programOption.create({ data: { programId: skatingKidsAdvMayar.id, name: 'حصة واحدة', price: 200, sessionsPerMonth: 1, capacity: 15 } })
  const ska1_4 = await prisma.programOption.create({ data: { programId: skatingKidsAdvMayar.id, name: '4 حصص شهرياً', price: 700, sessionsPerMonth: 4, capacity: 15 } })
  const ska1_8 = await prisma.programOption.create({ data: { programId: skatingKidsAdvMayar.id, name: '8 حصص شهرياً', price: 1150, sessionsPerMonth: 8, capacity: 15 } })
  for (const optId of [ska1_class.id, ska1_4.id, ska1_8.id]) {
    await prisma.programSchedule.createMany({
      data: [
        { optionId: optId, dayOfWeek: 1, startTime: '17:30', endTime: '19:00' },
      ]
    })
  }

  const skatingKidsBegMayar = await prisma.program.create({
    data: {
      categoryId: skatingCat.id,
      name: 'Kids Beginners - Coach Mayar (Mon)',
      description: 'حصص تزلج للأطفال المبتدئين مع كابتن ميار. أول إيجار سكيت مجاناً ✨',
    }
  })
  const skbm_class = await prisma.programOption.create({ data: { programId: skatingKidsBegMayar.id, name: 'حصة واحدة', price: 200, sessionsPerMonth: 1, capacity: 15 } })
  const skbm_4 = await prisma.programOption.create({ data: { programId: skatingKidsBegMayar.id, name: '4 حصص شهرياً', price: 700, sessionsPerMonth: 4, capacity: 15 } })
  const skbm_8 = await prisma.programOption.create({ data: { programId: skatingKidsBegMayar.id, name: '8 حصص شهرياً', price: 1150, sessionsPerMonth: 8, capacity: 15 } })
  for (const optId of [skbm_class.id, skbm_4.id, skbm_8.id]) {
    await prisma.programSchedule.createMany({
      data: [
        { optionId: optId, dayOfWeek: 1, startTime: '19:00', endTime: '20:30' },
      ]
    })
  }

  const skatingKidsAdvSoly = await prisma.program.create({
    data: {
      categoryId: skatingCat.id,
      name: 'Kids Advanced - Coach Soly (Tue)',
      description: 'حصص تزلج للأطفال المتقدمين مع كابتن سولي. أول إيجار سكيت مجاناً ✨',
    }
  })
  const skas_class = await prisma.programOption.create({ data: { programId: skatingKidsAdvSoly.id, name: 'حصة واحدة', price: 200, sessionsPerMonth: 1, capacity: 15 } })
  const skas_4 = await prisma.programOption.create({ data: { programId: skatingKidsAdvSoly.id, name: '4 حصص شهرياً', price: 700, sessionsPerMonth: 4, capacity: 15 } })
  const skas_8 = await prisma.programOption.create({ data: { programId: skatingKidsAdvSoly.id, name: '8 حصص شهرياً', price: 1150, sessionsPerMonth: 8, capacity: 15 } })
  for (const optId of [skas_class.id, skas_4.id, skas_8.id]) {
    await prisma.programSchedule.createMany({
      data: [
        { optionId: optId, dayOfWeek: 1, startTime: '20:30', endTime: '22:00' },
      ]
    })
  }

  console.log('✅ Skating programs seeded.')

  // ============================================================
  // 2. KICKBOXING
  // ============================================================
  const kickboxingCat = await prisma.programCategory.create({
    data: { name: 'Kickboxing', image: '/kickboxing.png' }
  })
  const kickboxing = await prisma.program.create({
    data: {
      categoryId: kickboxingCat.id,
      name: 'Kickboxing',
      description: 'حصص كيك بوكسينج قوية لتقوية الجسم وحرق الدهون.',
    }
  })
  const kb_class = await prisma.programOption.create({ data: { programId: kickboxing.id, name: 'حصة واحدة', price: 220, sessionsPerMonth: 1, capacity: 20 } })
  const kb_4 = await prisma.programOption.create({ data: { programId: kickboxing.id, name: '4 حصص شهرياً', price: 700, sessionsPerMonth: 4, capacity: 20 } })
  const kb_8 = await prisma.programOption.create({ data: { programId: kickboxing.id, name: '8 حصص شهرياً', price: 1100, sessionsPerMonth: 8, capacity: 20 } })
  for (const optId of [kb_class.id, kb_4.id, kb_8.id]) {
    await prisma.programSchedule.createMany({
      data: [
        { optionId: optId, dayOfWeek: 1, startTime: '17:30', endTime: '19:00' },
        { optionId: optId, dayOfWeek: 2, startTime: '17:30', endTime: '19:00' },
      ]
    })
  }
  console.log('✅ Kickboxing programs seeded.')

  // ============================================================
  // 3. FITNESS
  // ============================================================
  const fitnessCat = await prisma.programCategory.create({
    data: { name: 'Fitness', image: '/fitness.png' }
  })
  const fitness = await prisma.program.create({
    data: {
      categoryId: fitnessCat.id,
      name: 'Fitness',
      description: 'حصص لياقة بدنية متنوعة لبناء جسم صحي وقوي.',
    }
  })
  const fit_class = await prisma.programOption.create({ data: { programId: fitness.id, name: 'حصة واحدة', price: 180, sessionsPerMonth: 1, capacity: 20 } })
  const fit_4 = await prisma.programOption.create({ data: { programId: fitness.id, name: '4 حصص شهرياً', price: 550, sessionsPerMonth: 4, capacity: 20 } })
  const fit_8 = await prisma.programOption.create({ data: { programId: fitness.id, name: '8 حصص شهرياً', price: 850, sessionsPerMonth: 8, capacity: 20 } })
  const fit_12 = await prisma.programOption.create({ data: { programId: fitness.id, name: '12 حصة شهرياً', price: 1100, sessionsPerMonth: 12, capacity: 20 } })
  const fit_12q = await prisma.programOption.create({ data: { programId: fitness.id, name: '12 حصة / 3 شهور', price: 3100, sessionsPerMonth: 4, capacity: 20 } })
  for (const optId of [fit_class.id, fit_4.id, fit_8.id, fit_12.id, fit_12q.id]) {
    await prisma.programSchedule.createMany({
      data: [
        { optionId: optId, dayOfWeek: 0, startTime: '14:00', endTime: '15:00' },
        { optionId: optId, dayOfWeek: 0, startTime: '19:00', endTime: '20:00' },
        { optionId: optId, dayOfWeek: 4, startTime: '14:00', endTime: '15:00' },
        { optionId: optId, dayOfWeek: 4, startTime: '19:00', endTime: '20:00' },
        { optionId: optId, dayOfWeek: 3, startTime: '14:00', endTime: '15:00' },
        { optionId: optId, dayOfWeek: 3, startTime: '19:00', endTime: '20:00' },
      ]
    })
  }
  console.log('✅ Fitness programs seeded.')

  // ============================================================
  // 4. YOGA
  // ============================================================
  const yogaCat = await prisma.programCategory.create({
    data: { name: 'Yoga', image: '/yoga.png' }
  })
  const yoga = await prisma.program.create({
    data: {
      categoryId: yogaCat.id,
      name: 'Yoga',
      description: 'حصص يوجا للاسترخاء وتحسين المرونة والصحة النفسية.',
    }
  })
  const yg_class = await prisma.programOption.create({ data: { programId: yoga.id, name: 'حصة واحدة', price: 250, sessionsPerMonth: 1, capacity: 15 } })
  const yg_4 = await prisma.programOption.create({ data: { programId: yoga.id, name: '4 حصص شهرياً', price: 700, sessionsPerMonth: 4, capacity: 15 } })
  const yg_8 = await prisma.programOption.create({ data: { programId: yoga.id, name: '8 حصص شهرياً', price: 1200, sessionsPerMonth: 8, capacity: 15 } })
  for (const optId of [yg_class.id, yg_4.id, yg_8.id]) {
    await prisma.programSchedule.createMany({
      data: [
        { optionId: optId, dayOfWeek: 0, startTime: '19:00', endTime: '20:00' },
        { optionId: optId, dayOfWeek: 4, startTime: '21:00', endTime: '22:00' },
      ]
    })
  }
  console.log('✅ Yoga programs seeded.')

  // ============================================================
  // 5. BELLY DANCE
  // ============================================================
  const bellyCat = await prisma.programCategory.create({
    data: { name: 'Belly Dance', image: '/bellydance.png' }
  })
  const belly = await prisma.program.create({
    data: {
      categoryId: bellyCat.id,
      name: 'Belly Dance',
      description: 'حصص رقص شرقي للياقة والمرونة والاستمتاع.',
    }
  })
  const bd_class = await prisma.programOption.create({ data: { programId: belly.id, name: 'حصة واحدة', price: 250, sessionsPerMonth: 1, capacity: 15 } })
  const bd_4 = await prisma.programOption.create({ data: { programId: belly.id, name: '4 حصص شهرياً', price: 700, sessionsPerMonth: 4, capacity: 15 } })
  const bd_8 = await prisma.programOption.create({ data: { programId: belly.id, name: '8 حصص شهرياً', price: 1200, sessionsPerMonth: 8, capacity: 15 } })
  for (const optId of [bd_class.id, bd_4.id, bd_8.id]) {
    await prisma.programSchedule.createMany({
      data: [
        { optionId: optId, dayOfWeek: 2, startTime: '20:30', endTime: '21:30' },
        { optionId: optId, dayOfWeek: 0, startTime: '20:30', endTime: '21:30' },
      ]
    })
  }
  console.log('✅ Belly Dance programs seeded.')

  console.log('\n🎉 All programs seeded successfully!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
