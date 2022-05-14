import React from 'react'
import { Pier } from 'src/background/services/pier-service'

interface ShipErrorProps {
    ship: Pier
}

export const ShipError: React.FC<ShipErrorProps> = ({ ship }) => {
    return <div>Hey</div>
}