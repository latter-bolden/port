import React from 'react'

export const Archive = ({ className = '', primary = '', secondary = '' }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}><g><path className={secondary} d="M20.77 5a2 2 0 0 1-.02.22l-1.55 14A2 2 0 0 1 17.2 21H6.79a2 2 0 0 1-1.99-1.78l-1.55-14L3.23 5h17.54z"/><path className={primary} d="M10.59 14l-2.3-2.3a1 1 0 0 1 1.42-1.4L12 12.58l2.3-2.3a1 1 0 0 1 1.4 1.42L13.42 14l2.3 2.3a1 1 0 0 1-1.42 1.4L12 15.42l-2.3 2.3a1 1 0 1 1-1.4-1.42L10.58 14zM4 3h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5c0-1.1.9-2 2-2z"/></g></svg>
)