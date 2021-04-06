import React from 'react'

export const Logo = ({ className = '', primary = '', secondary = '' }: IconProps) => (
    <svg className={className} viewBox="0 0 216 216" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path className={`stroke-current ${secondary}`} d="M108 195.75C59.537 195.75 20.25 156.463 20.25 108C20.25 59.537 59.537 20.25 108 20.25C156.463 20.25 195.75 59.537 195.75 108C195.75 156.463 156.463 195.75 108 195.75Z" strokeWidth="13.5"/>
        <path className={`fill-current ${primary}`} d="M148.5 94.8294H132.507C131.302 101.909 128.207 106.189 122.704 106.189C112.729 106.189 107.054 94.5 91.5766 94.5C76.6145 94.5 68.7035 103.72 67.5 121.335H83.4935C84.6977 114.091 87.7932 109.811 93.4679 109.811C103.442 109.811 108.774 121.5 124.596 121.5C139.213 121.5 147.296 112.28 148.5 94.8294Z" />
    </svg>
)