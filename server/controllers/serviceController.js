import Service from '../models/Service.js'

export const getServices = async (req, res) => {
  try {
    const items = await Service.find({})
    const mapped = items.map(it => {
        const obj = it.toObject()
        const { _id, ...rest } = obj
        return { ...rest, id: String(_id) }
    })
    
    if (mapped.length) {
        res.json(mapped)
    } else {
        import('../../src/Frontend/data/services.js').then(({ SERVICES }) => res.json(SERVICES)).catch(() => res.json([]))
    }
  } catch (e) {
    console.warn('⚠ Services DB query failed, using fallback data:', e.message)
    import('../../src/Frontend/data/services.js').then(({ SERVICES }) => res.json(SERVICES)).catch(() => res.json([]))
  }
}
