import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../shared/Button';
import { RightArrow } from '../../icons/RightArrow';
import { LeftArrow } from '../../icons/LeftArrow';
import { RouteInfo, routeMap } from '../../routes';

const BootLink = ({ route }: { route: RouteInfo }) => (
    <li>
        <Link to={route.path} className="block w-full h-full p-4 border border-gray-700 hover:border-white focus:border-white transition-colors rounded">
            <strong className="block font-semibold mb-2">{ route.heading }</strong>
            <span dangerouslySetInnerHTML={{ __html: route.description }} />
        </Link>
    </li>
)

export const BootOptions = ({ className = '' }: { className: string }) => {
    const [showMore, setShowMore] = useState(false);
    const mainMenu = [routeMap.planet, routeMap.comet];
    const secondaryMenu = [routeMap.moon, routeMap.existing, routeMap.remote];

    function onClick() {
        setShowMore(!showMore)
    }

    return (
        <ul className={className}>
            { mainMenu.map(route => (<BootLink route={route} />))}
            {!showMore && (
                <li className="flex justify-center items-center w-full h-full">
                    <Button className="group" onClick={onClick}>
                        See More Options
                        <RightArrow className="w-7 h-7" secondary="fill-current text-gray-700 group-hover:text-gray-600 group-focus:text-gray-600 transition-colors" />
                    </Button>
                </li>
            )}
            {showMore && (
                <>
                    { secondaryMenu.map(route => (<BootLink route={route} />))}
                    <li className="flex justify-center items-center w-full h-full">
                        <Button className="group" onClick={onClick}>
                            <LeftArrow className="w-7 h-7" secondary="fill-current text-gray-700 group-hover:text-gray-600 group-focus:text-gray-600 transition-colors" />
                            See Less Options
                        </Button>
                    </li>
                </>
            )}
        </ul>
    )
}