import React from 'react'
import styled, { css } from 'styled-components'
import { Layers } from '@styled-icons/feather'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import type { UnifiedList } from 'src/annotations/cache/types'

export interface Props extends Pick<UnifiedList<'user-list'>, 'remoteId'> {
    onPress: () => void
    onFocus: () => void
    onUnfocus: () => void
    onPressActOnAll?: () => void
    onContextMenuBtnPress?: () => void
    index: number
    id?: string
    removeTooltipText?: string
    actOnAllTooltipText?: string
    resultItem: React.ReactNode
    contextMenuBtnRef?: React.RefObject<HTMLDivElement>
    selected?: boolean
    allTabsButtonPressed?: number
    focused?: boolean
}

class EntryRow extends React.Component<Props> {
    private handleActOnAllPress: React.MouseEventHandler = (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.props.onPressActOnAll?.()
        return false
    }

    private handleContextMenuBtnPress: React.MouseEventHandler = (e) => {
        this.props.onContextMenuBtnPress()
        e.preventDefault()
        e.stopPropagation()
        return false
    }

    render() {
        const {
            id,
            focused,
            remoteId,
            selected,
            resultItem,
            onPressActOnAll,
            contextMenuBtnRef,
        } = this.props

        let cleanID = parseInt(id.split('ListKeyName-')[1])

        return (
            <Row
                onClick={this.props.onPress}
                onMouseOver={this.props.onFocus}
                onMouseLeave={this.props.onUnfocus}
                isFocused={focused}
                id={id}
                title={resultItem['props'].children}
                zIndex={10000 - this.props.index}
            >
                <NameWrapper>
                    {resultItem}
                    {remoteId != null && (
                        <TooltipBox
                            tooltipText={'Shared Space'}
                            placement="bottom"
                        >
                            <Icon
                                heightAndWidth="14px"
                                // padding="6px"
                                icon={'peopleFine'}
                                hoverOff
                                color="greyScale5"
                            />
                        </TooltipBox>
                    )}
                </NameWrapper>
                <IconStyleWrapper>
                    {focused && this.props.onContextMenuBtnPress != null && (
                        <TooltipBox
                            tooltipText={'Share & Edit Space'}
                            placement="bottom"
                            targetElementRef={contextMenuBtnRef.current}
                        >
                            <ButtonContainer ref={contextMenuBtnRef}>
                                <Icon
                                    filePath={icons.dots}
                                    heightAndWidth="14px"
                                    onClick={this.handleContextMenuBtnPress}
                                />
                            </ButtonContainer>
                        </TooltipBox>
                    )}
                    {focused && onPressActOnAll && (
                        <ButtonContainer>
                            {this.props.allTabsButtonPressed === cleanID ? (
                                <TooltipBox
                                    tooltipText={
                                        <>
                                            All open tabs in this window
                                            <br /> have been added to this Space
                                        </>
                                    }
                                    placement="top"
                                >
                                    <Icon
                                        filePath={icons.checkRound}
                                        heightAndWidth="20px"
                                    />
                                </TooltipBox>
                            ) : (
                                <TooltipBox
                                    tooltipText={
                                        this.props.actOnAllTooltipText ?? ''
                                    }
                                    placement="top"
                                >
                                    <Icon
                                        filePath={icons.multiEdit}
                                        heightAndWidth="20px"
                                        onClick={this.handleActOnAllPress}
                                    />
                                </TooltipBox>
                            )}
                        </ButtonContainer>
                    )}
                    {selected ? (
                        <ButtonContainer selected={selected}>
                            <SelectionBox selected={selected}>
                                <Icon
                                    icon={icons.check}
                                    heightAndWidth="16px"
                                    color="black"
                                />
                            </SelectionBox>
                        </ButtonContainer>
                    ) : focused ? (
                        <ButtonContainer>
                            <SelectionBox selected={selected} />
                        </ButtonContainer>
                    ) : null}
                </IconStyleWrapper>
            </Row>
        )
    }
}

export const ActOnAllTabsButton = styled(Layers)`
    pointer-events: auto !important;
`

const ButtonContainer = styled.div<{ selected }>`
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    border-radius: 5px;
    align-items: center;
`

const SelectionBox = styled.div<{ selected }>`
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    background: ${(props) =>
        props.selected
            ? props.theme.colors.white
            : props.theme.colors.greyScale3};
`

export const IconStyleWrapper = styled.div`
    display: flex;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-end;
`

const Row = styled.div<{ isFocused; zIndex }>`
    align-items: center;
    display: flex;
    justify-content: space-between;
    transition: background 0.3s;
    height: 40px;
    width: fill-available;
    cursor: pointer;
    border-radius: 5px;
    padding: 0 9px;
    margin: 0 -5px;
    overflow: visible;
    color: ${(props) => props.isFocused && props.theme.colors.greyScale6};
    z-index: ${(props) => props.zIndex};
    &:last-child {
        border-bottom: none;
    }

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
        background: transparent;
    }

    ${(props) =>
        props.isFocused &&
        css`
            outline: 1px solid ${(props) => props.theme.colors.greyScale3};
            background: transparent;
        `}

    &:focus {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
        background: transparent;
    }
`

const NameWrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    max-width: 80%;
    font-size: 14px;
    width: 100%;
    min-width: 50px;
    flex: 1;
`

export default EntryRow
