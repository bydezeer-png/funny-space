require('dotenv').config()
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🔄 Updating all program data to English...')

  // Update all option names from Arabic to English
  const allOptions = await prisma.programOption.findMany()
  
  for (const opt of allOptions) {
    let newName = opt.name
    if (opt.name === 'حصة واحدة') newName = 'Single Class'
    else if (opt.name === '4 حصص شهرياً') newName = '4 Classes / Month'
    else if (opt.name === '8 حصص شهرياً') newName = '8 Classes / Month'
    else if (opt.name === '8 حصص - عرض الافتتاح') newName = '8 Classes / Month - Opening Offer'
    else if (opt.name === '12 حصة شهرياً') newName = '12 Classes / Month'
    else if (opt.name === '12 حصة / 3 شهور') newName = '12 Classes / 3 Months'
    
    if (newName !== opt.name) {
      await prisma.programOption.update({
        where: { id: opt.id },
        data: { name: newName }
      })
      console.log(`  Option: "${opt.name}" → "${newName}"`)
    }
  }

  // Update all program descriptions from Arabic to English
  const allPrograms = await prisma.program.findMany()
  
  const descMap = {
    'Skating - Beginners (Sun/Wed)': 'Beginner skating classes every Sunday & Wednesday.\nYour first skate rental is free ✨ After that, 40 LE per session.',
    'Skating - Advanced (Sun/Wed)': 'Advanced skating classes every Sunday & Wednesday.\nYour first skate rental is free ✨ After that, 40 LE per session.',
    'Skating - Advanced (Sat/Thu)': 'Advanced skating classes every Saturday & Thursday.\nYour first skate rental is free ✨ After that, 40 LE per session.',
    'Skating - Beginners (Sat/Thu)': 'Beginner skating classes every Saturday & Thursday.\nYour first skate rental is free ✨ After that, 40 LE per session.',
    'Kids Beginners - Coach Soly (Mon)': 'Kids beginner skating with Coach Soly — Monday 4:00–5:30 PM.\nYour first skate rental is free ✨',
    'Kids Advanced - Coach Mayar (Mon)': 'Kids advanced skating with Coach Mayar — Monday 5:30–7:00 PM.\nYour first skate rental is free ✨',
    'Kids Beginners - Coach Mayar (Mon)': 'Kids beginner skating with Coach Mayar — Monday 7:00–8:30 PM.\nYour first skate rental is free ✨',
    'Kids Advanced - Coach Soly (Tue)': 'Kids advanced skating with Coach Soly — Tuesday 8:30–10:00 PM.\nYour first skate rental is free ✨',
    'Kickboxing': 'High-energy kickboxing sessions for strength and fat burn.\nMonday & Tuesday 5:30–7:00 PM.',
    'Fitness': 'Full-body fitness training sessions.\nSunday, Thursday & Wednesday — 2:00–3:00 PM & 7:00–8:00 PM.',
    'Yoga': 'Relaxing yoga sessions for flexibility and mental health.\nSunday 7:00 PM & Thursday 9:00 PM.',
    'Belly Dance': 'Graceful belly dance classes for fitness and fun.\nTuesday 8:30–9:30 PM & Sunday.',
  }

  for (const prog of allPrograms) {
    if (descMap[prog.name]) {
      await prisma.program.update({
        where: { id: prog.id },
        data: { description: descMap[prog.name] }
      })
      console.log(`  Program: "${prog.name}" description updated`)
    }
  }

  console.log('\n✅ All data updated to English!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
