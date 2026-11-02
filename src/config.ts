/**
 * ALL business content lives here. Change a value, save, redeploy.
 * Anything marked TODO still needs real information from the owner.
 *
 * Prices: put a number (in ₹) to show it. Leave `null` and the site shows
 * "Price on request" and asks the customer to confirm on WhatsApp.
 */

export type CarType = 'hatchback' | 'sedan' | 'suv'
export type Billing = 'monthly' | 'yearly'

export const BRAND = {
  name: 'CW',
  descriptor: 'Doorstep Car Wash',
  tagline: 'Showroom shine. At your doorstep.',
  city: '', // TODO: e.g. "Lucknow"
  // TODO: WhatsApp number with country code, digits only, e.g. "919876543210".
  // While empty, the booking opens WhatsApp and lets the customer pick a contact.
  whatsapp: '',
  phoneDisplay: '', // TODO: e.g. "+91 98765 43210"
  hours: '7:00 AM – 8:00 PM, all days', // TODO: confirm
}

/**
 * Refer & earn defaults. The owner changes these in /admin → Settings;
 * the values here are used only until then (or if the database is not connected).
 * friendPercent: discount for the new customer on their first month.
 * referrerPercent: reward for the customer who shared the code.
 */
export const REFERRAL = { enabled: true, friendPercent: 10, referrerPercent: 10 }

/**
 * Pincodes you serve. Leave empty to hide the "check my area" box.
 * TODO: add pincodes, e.g. ['226010', '226016'].
 */
export const SERVICE_PINCODES: string[] = []

/** Area names shown on the site (optional). TODO */
export const SERVICE_AREAS: string[] = []

export const CAR_TYPES: { id: CarType; label: string; hint: string }[] = [
  { id: 'hatchback', label: 'Hatchback', hint: 'Swift, i20, Baleno, Tiago' },
  { id: 'sedan', label: 'Sedan', hint: 'City, Dzire, Verna, Ciaz' },
  { id: 'suv', label: 'SUV / MUV', hint: 'Creta, Nexon, XUV700, Innova' },
]

type PriceTable = Record<CarType, Record<Billing, number | null>>

export type Plan = {
  id: string
  name: string
  badge?: string
  washesPerMonth: string // TODO: e.g. "8 washes / month"
  features: string[]
  prices: PriceTable
}

const noPrices = (): PriceTable => ({
  hatchback: { monthly: null, yearly: null },
  sedan: { monthly: null, yearly: null },
  suv: { monthly: null, yearly: null },
})

export const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Daily Shine',
    washesPerMonth: '', // TODO
    features: ['Exterior waterless / foam wash', 'Glass & mirror cleaning', 'Tyre wash', 'Doorstep at your parking'],
    prices: noPrices(), // TODO: real prices
  },
  {
    id: 'premium',
    name: 'Premium Care',
    badge: 'Most popular',
    washesPerMonth: '', // TODO
    features: [
      'Everything in Daily Shine',
      'Interior vacuum',
      'Dashboard & door-pad wipe',
      'Tyre shine dressing',
      'Monthly wax polish',
    ],
    prices: noPrices(), // TODO
  },
  {
    id: 'elite',
    name: 'Showroom Elite',
    washesPerMonth: '', // TODO
    features: [
      'Everything in Premium Care',
      'Seat & mat deep clean',
      'Engine bay dressing',
      'AC vent sanitising',
      'Priority time slot',
    ],
    prices: noPrices(), // TODO
  },
]

/** One-time add-ons. TODO: prices */
export const ADDONS: { id: string; name: string; price: number | null }[] = [
  { id: 'interior', name: 'Interior deep cleaning', price: null },
  { id: 'wax', name: 'Wax polish', price: null },
  { id: 'rubbing', name: 'Rubbing & polishing', price: null },
  { id: 'engine', name: 'Engine bay cleaning', price: null },
  { id: 'ac', name: 'AC vent sanitisation', price: null },
  { id: 'ceramic', name: 'Ceramic coating', price: null },
]

export const TIME_SLOTS = ['Early morning (6–9 AM)', 'Morning (9–12)', 'Afternoon (12–4)', 'Evening (4–8)']

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * The 3D scroll story. The hero shows the dusty car; each step below drives
 * one stage of the 3D car (foam → rinse → shine) as the user scrolls.
 */
export const HERO = {
  kicker: 'Doorstep car wash · Monthly & yearly plans',
  title: 'Your car, showroom fresh. Every week.',
  text: 'Dust, bird drops, city grime. We come to your parking and wash it on schedule. Scroll down to watch.',
}

export const STORY = [
  {
    kicker: '01 · Thick foam',
    title: 'pH-neutral foam lifts the dirt.',
    text: 'Snow foam soaks into every panel so dirt slides off without scratching the paint.',
  },
  {
    kicker: '02 · Rinse',
    title: 'Low-water rinse, high pressure.',
    text: 'We use a fraction of the water of a bucket wash. No mess left in your parking.',
  },
  {
    kicker: '03 · Dry & shine',
    title: 'Microfibre dry. Mirror finish.',
    text: 'Plush microfibre, glass cleaner and tyre dressing. Every visit, same checklist.',
  },
]

export const HOW_IT_WORKS = [
  { title: 'Pick a plan', text: 'Monthly or yearly, based on your car type.' },
  { title: 'Share location', text: 'Home, office or society parking. We come to you.' },
  { title: 'We wash on schedule', text: 'Same days, same time slot, every week.' },
  { title: 'Photo on WhatsApp', text: 'You get a photo of your clean car after every wash.' },
]

export const WHY_US = [
  { title: 'Doorstep', text: 'No driving to a washing centre. No waiting.' },
  { title: 'Water saving', text: 'Waterless & low-water methods, safe for society parking.' },
  { title: 'Trained staff', text: 'Verified team with a fixed checklist for every car.' },
  { title: 'Safe products', text: 'pH-neutral shampoo and microfibre only. No harsh chemicals.' },
]

export const FAQ = [
  {
    q: 'Do I need to be present during the wash?',
    a: 'No. Share the parking spot and car details once. We send a photo on WhatsApp after every wash.',
  },
  {
    q: 'Do you need water or electricity from me?',
    a: 'No. We bring our own equipment and water.', // TODO: confirm
  },
  {
    q: 'What if it rains?',
    a: 'Missed washes because of rain are rescheduled at no extra cost.', // TODO: confirm policy
  },
  {
    q: 'Can I pause or cancel the plan?',
    a: 'Yes. Message us on WhatsApp before your next billing date.', // TODO: confirm policy
  },
  {
    q: 'Do you cover more than one car?',
    a: 'Yes. Add every car in the booking form and we will share a family / society price.',
  },
]
