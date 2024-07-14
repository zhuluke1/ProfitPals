import React, { useRef, useState, Component, useEffect } from 'react'
import {
    View,
    Image,
    ScrollView,
    Animated,
    Dimensions,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
} from 'react-native'
import GainLossCard from '../../components/profile/GainLossCard'
import TopHoldings from '../../components/profile/TopHoldings'
import { images } from '../../constants'
import {
    LinkExit,
    LinkEvent,
    LinkLogLevel,
    LinkSuccess,
    dismissLink,
    LinkOpenProps,
    usePlaidEmitter,
    LinkIOSPresentationStyle,
    LinkTokenConfiguration,
    EmbeddedLinkView,
} from 'react-native-plaid-link-sdk'

import { create, open } from 'react-native-plaid-link-sdk/dist/PlaidLink'
import {
    getCurrentUser,
    updateUserWithPlaidCredentials,
} from '../../lib/appwrite'
import axios from 'axios'
import { useGlobalContext } from '../../context/GlobalProvider'
import InvestmentReturns from '../profile/InvestmentReturns'

const { width: screenWidth } = Dimensions.get('window')

const Portfolio = ({ topHoldings, topGainers, topLosers }) => {
    const scrollX = useRef(new Animated.Value(0)).current
    const { user, setUser } = useGlobalContext()
    const [contentWidth, setContentWidth] = useState(1)
    const [holdings, setHoldings] = useState(null)

    const [publicToken, setPublicToken] = useState(null)
    const [portfolioValue, setPortfolioValue] = useState(0)

    // Run on first render
    useEffect(() => {
        const initialize = async () => {
            if (user.plaidAccessToken) {
                fetchHoldings()
            } else {
                fetchLinkToken()
                fetchHoldings()
            }
        }

        initialize()
    }, [])

    // Run when `user`changes
    useEffect(() => {
        const initialize = async () => {
            if (user.plaidAccessToken) {
                fetchHoldings()
            } else {
                fetchLinkToken()
                fetchHoldings()
            }
        }

        initialize()
    }, [user])

    const fetchLinkToken = async () => {
        try {
            const response = await axios.post(
                'http://localhost:3000/create_link_token'
            )
            create({ token: response.data.link_token })
            const openProps = createLinkOpenProps()
            open(openProps)
        } catch (error) {
            console.error('Error fetching link token:', error)
        }
    }

    const createLinkOpenProps = () => {
        return {
            onSuccess: async (success) => {
                try {
                    const response = await axios.post(
                        'http://localhost:3000/api/set_access_token',
                        {
                            public_token: success.publicToken,
                        }
                    )

                    await updateUserWithPlaidCredentials(
                        response.data.access_token,
                        response.data.item_id
                    )

                    const updatedUser = await getCurrentUser()
                    setUser(updatedUser)
                } catch (error) {
                    console.error('Error setting access token', error)
                }
            },
            onExit: (linkExit) => {
                dismissLink()
            },
            iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
            logLevel: LinkLogLevel.ERROR,
        }
    }

    const fetchHoldings = async () => {
        if (!user.plaidAccessToken) {
            return
        }

        try {
            const response = await axios.post(
                'http://localhost:3000/investments/holdings/get',
                {
                    access_token: user.plaidAccessToken,
                }
            )
            setHoldings(response.data.holdings)
            const totalValue = response.data.holdings.reduce(
                (total, holding) => total + holding.institution_value,
                0
            )
            setPortfolioValue(totalValue)
        } catch (error) {
            console.error('Error fetching holdings', error)
        }
    }

    usePlaidEmitter((event) => {
        if (event.eventName === 'SUCCESS') {
            setPublicToken(event.metadata.publicToken)
        }
    })

    return (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            className="flex-1"
        >
            <View className="items-center">
                {/* <InvestmentReturns /> */}

                <GainLossCard
                    gainloss={`$${portfolioValue.toFixed(2)}`}
                    percentage="-20"
                />

                <View className="bg-white border border-gray-100 rounded-xl p-2 shadow-lg mt-4">
                    <Image
                        source={images.chart}
                        className="w-96 h-72 rounded-xl"
                        resizeMode="contain"
                    />
                </View>

                <View style={{ position: 'relative', width: '100%' }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mt-4"
                        onContentSizeChange={(w) => setContentWidth(w)}
                        onScroll={Animated.event(
                            [
                                {
                                    nativeEvent: {
                                        contentOffset: { x: scrollX },
                                    },
                                },
                            ],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                    >
                        <View className="flex flex-row mx-4">
                            <TopHoldings
                                holdings={topHoldings}
                                title="Holdings"
                                boxStyle="mr-4"
                            />
                            <TopHoldings
                                holdings={topGainers}
                                title="Gainers"
                                boxStyle="mr-4"
                            />
                            <TopHoldings
                                holdings={topLosers}
                                title="Losers"
                                boxStyle="mr-4"
                            />
                        </View>
                    </ScrollView>

                    {contentWidth > screenWidth && (
                        <View
                            style={{
                                height: 8,
                                backgroundColor: '#e0e0e0',
                                borderRadius: 4,
                                marginTop: 8,
                                overflow: 'hidden',
                                width: '90%',
                                alignSelf: 'center',
                            }}
                        >
                            <Animated.View
                                style={{
                                    height: 8,
                                    backgroundColor: '#043725',
                                    borderRadius: 4,
                                    width: scrollX.interpolate({
                                        inputRange: [
                                            0,
                                            contentWidth - screenWidth,
                                        ],
                                        outputRange: [
                                            (screenWidth / contentWidth) *
                                                screenWidth,
                                            screenWidth,
                                        ],
                                        extrapolate: 'clamp',
                                    }),
                                    transform: [
                                        {
                                            translateX: scrollX.interpolate({
                                                inputRange: [
                                                    0,
                                                    contentWidth - screenWidth,
                                                ],
                                                outputRange: [
                                                    0,
                                                    screenWidth -
                                                        (screenWidth /
                                                            contentWidth) *
                                                            screenWidth,
                                                ],
                                                extrapolate: 'clamp',
                                            }),
                                        },
                                    ],
                                }}
                            />
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    )
}

export default Portfolio
