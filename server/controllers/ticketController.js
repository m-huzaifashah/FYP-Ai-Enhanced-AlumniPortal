import Ticket from '../models/Ticket.js'

export const createTicket = async (req, res) => {
  try {
    const { title, description, type } = req.body
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' })
    }

    const ticket = await Ticket.create({
      title,
      description,
      type: type || 'Issue',
      createdBy: req.user.id
    })

    const populatedTicket = await ticket.populate('createdBy', 'name email role')
    return res.status(201).json(populatedTicket)
  } catch (error) {
    console.error('Error creating ticket:', error)
    return res.status(500).json({ error: 'Internal server error while creating ticket' })
  }
}

export const getTickets = async (req, res) => {
  try {
    const { role, id } = req.user
    
    let tickets
    if (role === 'admin') {
      tickets = await Ticket.find().populate('createdBy', 'name email role').sort({ createdAt: -1 })
    } else {
      tickets = await Ticket.find({ createdBy: id }).populate('createdBy', 'name email role').sort({ createdAt: -1 })
    }
    
    return res.status(200).json(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return res.status(500).json({ error: 'Internal server error while fetching tickets' })
  }
}

export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['Open', 'Resolved', 'Rejected']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('createdBy', 'name email role')

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    return res.status(200).json(ticket)
  } catch (error) {
    console.error('Error updating ticket status:', error)
    return res.status(500).json({ error: 'Internal server error while updating ticket status' })
  }
}
