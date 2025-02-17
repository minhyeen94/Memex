import * as React from 'react'
import styled from 'styled-components'

import { FullPage } from 'src/common-ui/components/design-library/FullPage'
import { auth } from 'src/util/remote-functions-background'
import DisplayNameSetup from 'src/overview/sharing/components/DisplayNameSetup'
import UpdateEmail from 'src/overview/sharing/components/UpdateEmail'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import Logic from './UserScreen/logic'
import type { State, Event, Dependencies } from './UserScreen/types'
import { runInBackground } from 'src/util/webextensionRPC'
import { StatefulUIElement } from 'src/util/ui-logic'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

const styles = require('./styles.css')

const DisplayNameBox = styled.div`
    width: fill-available;
`

export interface Props extends Dependencies {
    setAuthMode: (mode) => void
}

export default class UserScreen extends StatefulUIElement<Props, State, Event> {
    static defaultProps: Pick<
        Props,
        'navToDashboard' | 'authBG' | 'personalCloudBG' | 'navToGuidedTutorial'
    > = {
        authBG: runInBackground(),
        personalCloudBG: runInBackground(),
        navToDashboard: () => {},
        navToGuidedTutorial: () => {},
    }

    async componentDidMount() {
        const user = await this.props.authBG.getCurrentUser()
        this.processEvent('getCurrentUser', { currentUser: user })
        this.processEvent('setSubscriptionStatus', { email: user.email })
    }

    constructor(props: Props) {
        super(props, new Logic(props))
    }

    render() {
        const isStaging =
            process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
            process.env.NODE_ENV === 'development'

        const baseUrl = isStaging
            ? 'https://cloudflare-memex-staging.memex.workers.dev'
            : 'https://cloudfare-memex.memex.workers.dev'

        return (
            <FullPage>
                {this.state.currentUser != null ? (
                    <>
                        <SettingSection
                            title={'My Account'}
                            icon={'personFine'}
                        >
                            <FieldsContainer>
                                <SubscriptionStatusContainer>
                                    {this.state.subscriptionStatusLoading ===
                                        'running' && (
                                        <LoadingIndicatorBox>
                                            <LoadingIndicator size={20} />
                                        </LoadingIndicatorBox>
                                    )}
                                    {this.state.subscriptionStatusLoading ===
                                        'success' && (
                                        <SubscriptionStatusBox>
                                            <PlanDetailsContainer>
                                                <PlanTitle>
                                                    {this.state
                                                        .subscriptionStatus ===
                                                    'no-subscription'
                                                        ? 'Free Plan'
                                                        : 'Subscription Active'}
                                                </PlanTitle>
                                                <PlanDetailsBox>
                                                    <PlanDetailsRow>
                                                        <LimitCount>
                                                            {
                                                                this.state
                                                                    .pageLimit
                                                            }
                                                        </LimitCount>
                                                        unique pages per month
                                                    </PlanDetailsRow>
                                                    <PlanDetailsRow>
                                                        <LimitCount>
                                                            {this.state.AILimit}
                                                        </LimitCount>
                                                        AI requests per month
                                                    </PlanDetailsRow>
                                                </PlanDetailsBox>{' '}
                                            </PlanDetailsContainer>
                                            <SubscriptionActionBox>
                                                <PrimaryAction
                                                    label={'Upgrade'}
                                                    onClick={() => {
                                                        window.open(
                                                            isStaging
                                                                ? 'https://memex.garden/upgradeStaging'
                                                                : 'https://memex.garden/upgrade',
                                                            '_blank',
                                                        )
                                                    }}
                                                    size={'medium'}
                                                    type={'secondary'}
                                                />
                                                {this.state
                                                    .subscriptionStatus !==
                                                    'no-subscription' && (
                                                    <PrimaryAction
                                                        label={'Manage'}
                                                        onClick={() => {
                                                            window.open(
                                                                isStaging
                                                                    ? 'https://billing.stripe.com/p/login/test_bIY036ggb10LeqYeUU'
                                                                    : 'https://billing.stripe.com/p/login/8wM015dIp6uPdb2288',
                                                                '_blank',
                                                            )
                                                        }}
                                                        size={'medium'}
                                                        type={'tertiary'}
                                                    />
                                                )}
                                            </SubscriptionActionBox>
                                        </SubscriptionStatusBox>
                                    )}
                                </SubscriptionStatusContainer>
                                <DisplayNameBox>
                                    <DisplayNameSetup authBG={auth} />
                                </DisplayNameBox>
                                <DisplayNameBox>
                                    <UpdateEmail
                                        authBG={auth}
                                        email={this.state.currentUser.email}
                                    />
                                </DisplayNameBox>
                                <UserIdField>
                                    <Icon
                                        filePath={icons.personFine}
                                        heightAndWidth="20px"
                                        hoverOff
                                    />
                                    {this.state.currentUser.id}
                                </UserIdField>
                                <InfoText>
                                    Your internal user ID for support requests
                                </InfoText>

                                {this.state.passwordResetSent ? (
                                    <ConfirmationMessage>
                                        <Icon
                                            icon="mail"
                                            heightAndWidth="22px"
                                            color="prime1"
                                        />
                                        Check your email inbox:{' '}
                                        <strong>
                                            {this.state.currentUser.email}
                                        </strong>
                                    </ConfirmationMessage>
                                ) : (
                                    <PrimaryAction
                                        label={'Reset Password'}
                                        onClick={() => {
                                            this.processEvent(
                                                'sendPasswordReset',
                                                null,
                                            )
                                            this.props.setAuthMode(
                                                'ConfirmResetPassword',
                                            )
                                        }}
                                        size={'medium'}
                                        type={'secondary'}
                                    />
                                )}
                            </FieldsContainer>
                        </SettingSection>
                    </>
                ) : (
                    <SettingSection title={'My Account'} icon={'personFine'}>
                        <LoadingIndicatorBox>
                            <LoadingIndicator />
                        </LoadingIndicatorBox>
                    </SettingSection>
                )}
            </FullPage>
        )
    }
}

const SubscriptionActionBox = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
    justify-content: center;
`

const PlanDetailsContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-gap: 5px;
`

const PlanTitle = styled.div`
    font-size: 20px;
    font-weight: 600;
    color: ${(props) => props.theme.colors.white};
`

const PlanDetailsBox = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
    margin-top: 5px;
`

const PlanDetailsRow = styled.div`
    display: flex;
    align-items: center;
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale5};
    grid-gap: 5px;
`

const LimitCount = styled.div`
    font-weight: 600;
    color: ${(props) => props.theme.colors.greyScale6};
`

const SubscriptionStatusContainer = styled.div`
    width: 100%;
    display: flex;
    align-items: flex-start;
`
const SubscriptionStatusBox = styled.div`
    display: flex;
    padding: 15px 15px;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 16px;
    border-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors.greyScale2};

    & strong {
        color: ${(props) => props.theme.colors.white};
        font-weight: 600;
    }
`

const ConfirmationMessage = styled.div`
    display: flex;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    grid-gap: 5px;
`

const LoadingIndicatorBox = styled.div`
    padding: 50px 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
`

const FieldsContainer = styled.div`
    display: flex;
    grid-gap: 20px;
    flex-direction: column;
    align-items: flex-start;
    width: 440px;
    margin-top: 15px;
`

const Section = styled.div`
    background: #ffffff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 50px;
    margin-bottom: 30px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    opacity: 0.7;
    padding-left: 10px;
    margin-top: -15px;
    margin-bottom: 15px;
`

const UserIdField = styled.div`
    display: flex;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-start;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    color: ${(props) => props.theme.colors.greyScale6};
    background: transparent;
    height: 44px;
    border-radius: 5px;
    width: fill-available;
    padding: 0 9px;
    font-size: 14px;
`
