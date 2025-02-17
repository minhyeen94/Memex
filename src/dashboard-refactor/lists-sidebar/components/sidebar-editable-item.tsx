import React from 'react'
import styled from 'styled-components'

import Margin from 'src/dashboard-refactor/components/Margin'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

interface State {
    value: string
}

export interface Props {
    initValue?: string
    errorMessage: string | null
    onCancelClick: () => void
    onConfirmClick: (value: string) => void
}

export default class ListsSidebarEditableItem extends React.PureComponent<
    Props,
    State
> {
    static defaultProps: Partial<Props> = { initValue: '' }
    state: State = { value: this.props.initValue }

    private handleChange: React.MouseEventHandler<HTMLInputElement> = (event) =>
        this.setState({ value: (event.target as HTMLInputElement).value })

    private handleInputKeyDown: React.KeyboardEventHandler = (e) => {
        // Allow escape keydown to bubble up to close the sidebar only if no input state
        if (e.key === 'Escape') {
            if (this.state.value.length) {
                e.stopPropagation()
            }
            this.props.onCancelClick()
            return
        }

        if (e.key === 'Enter') {
            this.props.onConfirmClick(this.state.value)
        }

        // If we don't have this, events will bubble up into the page!
        e.stopPropagation()
    }

    private handleConfirm: React.MouseEventHandler = () => {
        this.props.onConfirmClick(this.state.value)
    }

    private handleCancel: React.MouseEventHandler = () =>
        this.props.onCancelClick()

    render() {
        return (
            <>
                <Container>
                    <EditableListTitle
                        autoFocus
                        onChange={this.handleChange}
                        value={this.state.value}
                        onKeyDown={this.handleInputKeyDown}
                    />
                    <ActionButtonBox right="5px">
                        <Icon
                            filePath={icons.removeX}
                            heightAndWidth="14px"
                            onClick={this.handleCancel}
                            padding={'5px'}
                        />
                        <Icon
                            filePath={icons.check}
                            heightAndWidth="16px"
                            onClick={this.handleConfirm}
                            color={'prime1'}
                            padding={'4px'}
                        />
                    </ActionButtonBox>
                </Container>
                {this.props.errorMessage && (
                    <ErrMsg>{this.props.errorMessage}</ErrMsg>
                )}
            </>
        )
    }
}

const EditableListTitle = styled.input`
    padding: 2px 10px;
    border-radius: 3px;
    outline: none;
    background: white;
    flex: 0 1 100%;
    display: flex;
    width: 70%;
    margin: 5px 0 5px 5px;
    font-size: 14px;
    height: 30px;
    outline: none;
    border: none;
    color: ${(props) => props.theme.colors.white};
    background-color: ${(props) => props.theme.colors.greyScale2};
    flex: 1;
    width: -webkit-fill-available;

    &:focus-within {
        outline: 1px solid ${(props) => props.theme.colors.greyScale4};
    }
`

const ActionButtonBox = styled(Margin)`
    display: grid;
    grid-gap: 5px;
    justify-content: center;
    grid-auto-flow: column;
    width: 30px;
`

const ErrMsg = styled.div`
    color: red;
    width: 100%;
    text-align: center;
`

const Container = styled.div<Props>`
    width: fill-available;
    display: flex;
    grid-gap: 20px;
    justify-content: space-between;
    align-items: center;
    background-color: transparent;
    padding: 5px 15px 5px 15px;
`
