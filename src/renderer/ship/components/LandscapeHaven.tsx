import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router';
import { useStore } from '../../App';
import Portal from '../../shared/Portal';

export const LandscapeHaven = () => {
    const match = useRouteMatch<{ slug: string }>('/pier/:slug/launch');
    const { slug } = match.params;
    const piers = useStore(state => state.piers); 
    debugger;

    return (
        <Portal id="landscape">
            {piers.map(pier => {
                const url = pier.type === 'remote' ? pier.directory : `http://localhost:${pier.webPort}`;

                return (
                    <iframe
                        key={url}
                        className={`h-full w-full ${pier.slug !== slug ? 'hidden' : ''}`}
                        src={url} 
                        allowFullScreen 
                    />
                )
            })}
        </Portal>
    )
}