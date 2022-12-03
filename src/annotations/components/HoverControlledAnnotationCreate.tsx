import React from 'react'

import AnnotationCreate, { Props } from './AnnotationCreate'
import { NoteResultHoverState } from './types'

export * from './AnnotationCreate'

interface State {
    hoverState: NoteResultHoverState
}

export default class HoverControlledAnnotationEditable extends React.Component<
    Props,
    State
> {
    static defaultProps = AnnotationCreate

    state: State = { hoverState: null }

    private setHoverState: (
        hoverState: NoteResultHoverState,
    ) => React.MouseEventHandler = (hoverState) => (e) =>
        this.setState({ hoverState })

    render() {
        return (
            <AnnotationCreate
                {...this.props}
                onNoteHover={this.setHoverState('note')}
                onUnhover={this.setHoverState(null)}
                hoverState={this.state.hoverState}
            />
        )
    }
}
