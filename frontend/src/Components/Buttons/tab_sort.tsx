import React from 'react'
import arrowDownIcon from '../../images/arrow-down.png'
import arrowDownSelectedIcon from '../../images/arrow-down-selected.png'
import arrowUpSelectedIcon from '../../images/arrow-up-selected.png'
import {Button, Typography} from '@mui/material'

function TableSort(props) {
    function handlClick() {
        if (!props.disabled) {
            if (props.sort.title === props.title) {
                if (props.sort.order === -1) {
                    props.setSort({title: props.title, name: props.name, order: 1})
                } else {
                    props.setSort({title: '', name: '', order: -1})
                }
            } else {
                props.setSort({title: props.title, name: props.name, order: -1})
            }
        }
    }
    function icon() {
        if (props.sort.title === props.title) {
            if (props.sort.order === -1) return arrowDownSelectedIcon
            else return arrowUpSelectedIcon
        } else return arrowDownIcon
    }
    return (
        <>
            {props.disabled ? (
                <Typography noWrap style={{color: '#778191', fontWeight: '500'}}>
                    {props.title}
                </Typography>
            ) : (
                <Button
                color="secondary"
                    endIcon={
                        <img src={icon()} width="8px" height="11px" style={{marginRight: '5px'}} />
                    }
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        // color: '#778191',
                        fontSize: '16px',
                        whiteSpace: 'nowrap',
                    }}
                    onClick={handlClick}
                >
                    {props.title}
                </Button>
            )}
        </>
    )
}

export default TableSort
