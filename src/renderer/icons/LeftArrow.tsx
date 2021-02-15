import React from 'react'

export const LeftArrow = ({ className = '', primary = '', secondary = '' }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="10" className={primary}/><path className={secondary} d="M9.41 11H17a1 1 0 0 1 0 2H9.41l2.3 2.3a1 1 0 1 1-1.42 1.4l-4-4a1 1 0 0 1 0-1.4l4-4a1 1 0 0 1 1.42 1.4L9.4 11z"/></svg>
)