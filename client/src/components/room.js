import React from 'react';
import Switch from 'react-ios-switch';
import {useDispatch} from 'react-redux';
import {toggleRoom} from './../actions';
import Lightbulb from './lightbulbs.js';

function Room({room, lights}){
    const dispatch = useDispatch();
    const allSynced = lights.every(l => l.sync);

    return (
        <div className="option-menu">
            <div className="titlebar">
                <div>{room.name}</div>
                <Switch
                    checked={allSynced}
                    onColor={"rgb(33, 33, 33)"}
                    onChange={() => {
                        dispatch(toggleRoom(room.id, !allSynced))
                    }}
                />
            </div>
            {lights.map((li, i) => <Lightbulb key={li.id} {...li} last={i === lights.length-1}/>)}
        </div>
    )
}

export default Room
