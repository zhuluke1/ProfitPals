import {
    View,
    Text,
    Image,
    TouchableOpacity,
    TextInput,
    Animated,
    LayoutAnimation,
    ScrollView,
} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import InfoBox from '../InfoBox'
import { FontAwesome } from '@expo/vector-icons'
import {
    likePost,
    createComment,
    getPostComments,
    getPostLikes,
} from '../../lib/appwrite'
import { formatDistanceToNow } from 'date-fns'
import { router } from 'expo-router'

const CommunityPost = ({ user, post }) => {
    const { creator, title, body, date, comments, postId } = post
    const [likes, setLikes] = useState(0)
    const [hasLiked, setHasLiked] = useState(false)
    const [showComments, setShowComments] = useState(false) // toggle comment visibility
    const [newComment, setNewComment] = useState('') // new comment input
    const [commentList, setCommentList] = useState(comments) // comments array
    const [commentCount, setCommentCount] = useState(comments.length)

    const slideAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        const fetchLikes = async () => {
            try {
                const { likeCount, userLiked } = await getPostLikes(
                    postId,
                    user.$id
                )
                setLikes(likeCount)
                setHasLiked(userLiked)
                // console.log('User liked:', userLiked);
            } catch (error) {
                console.error('Error fetching likes: ', error)
            }
        }

        const fetchComments = async () => {
            try {
                const fetchedComments = await getPostComments(postId)
                setCommentList(fetchedComments)
                setCommentCount(fetchedComments.length)
            } catch (error) {
                console.error('Error fetching comments: ', error)
            }
        }

        fetchLikes()
        fetchComments()
    }, [postId, user.$id])

    const handleLike = async () => {
        try {
            await likePost(postId, user.$id)

            if (!hasLiked) {
                setLikes(likes + 1)
                setHasLiked(true)
            } else {
                setLikes(likes - 1)
                setHasLiked(false)
            }
        } catch (error) {
            console.error('Error liking the post: ', error)
        }
    }

    const handleAddComment = async () => {
        if (newComment.trim()) {
            try {
                // await createComment( postId, user.$id, newComment );
                // setCommentList([
                //     ...commentList,
                //     // { user: user.username, text: newComment, owner: user.$id },
                //     // { user: user?.username, text: newComment, owner: user.$id },
                //     owner: { username: user.username },
                //     text: newComment,
                // ]);
                // setNewComment('')
                const createdComment = await createComment(
                    postId,
                    user.$id,
                    newComment
                )
                const newCommentObject = {
                    ...createdComment,
                    owner: { username: user.username },
                    text: newComment,
                }

                setCommentList([...commentList, newCommentObject])
                setNewComment('')

                setCommentCount(commentCount + 1)
            } catch (error) {
                console.error('Error adding comment: ', error)
            }
        }
    }

    const toggleComments = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setShowComments(!showComments)
    }

    const navigateToProfile = () => {
        console.log(JSON.stringify(creator, null, 2))
        router.push({
            pathname: '/profile/socialProfile',
            params: {
                profileUser: JSON.stringify(creator),
            },
        })
    }

    return (
        <View className="bg-white rounded-lg shadow-sm p-4">
            <View className="flex flex-row items-center">
                {/* user pfp */}
                {/* <View className="w-10 h-10 rounded-full justify-center items-center overflow-hidden">
                    <Image
                        source={{ uri: creator?.avatar }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                </View> */}
                <TouchableOpacity
                    className="w-10 h-10 rounded-full justify-center items-center overflow-hidden"
                    onPress={() => navigateToProfile()}
                >
                    <Image
                        source={{ uri: creator?.avatar }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                </TouchableOpacity>

                {/* username */}
                <InfoBox
                    title={`@${creator?.username}`}
                    containerStyles="mt-3 ml-2"
                    titleStyles="text-md"
                />
            </View>

            {/* Title */}
            <Text className="font-hsemibold text-black text-xl mt-2">
                {title}
            </Text>

            {/* Text */}
            <Text className="font-hregular text-black text-md mt-1">
                {body}
            </Text>

            {/* Time and Date */}
            <Text className="font-hregular text-gray-500 text-sm mt-3">
                {formatDistanceToNow(new Date(date), { addSuffix: true })}
            </Text>

            {/* Like and comment Touchable Opacity Icons */}
            <View className="flex flex-row mt-2">
                <TouchableOpacity
                    onPress={handleLike}
                    className="flex flex-row items-center mr-4"
                >
                    <FontAwesome
                        name="thumbs-up"
                        size={20}
                        color={hasLiked ? '#1d4b3b' : '#808080'}
                    />
                    <Text className="ml-1">{likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={toggleComments}
                    className="flex flex-row items-center"
                >
                    <FontAwesome name="comment" size={20} color="#1d4b3b" />
                    <Text className="ml-1">{commentCount}</Text>
                </TouchableOpacity>
            </View>

            {/* Comment Section */}
            {showComments && (
                <View className="mt-4">
                    <ScrollView
                        className="max-h-52 mb-4"
                        showsVerticalScrollIndicator={true}
                    >
                        {commentList.map((item, index) => (
                            <View
                                key={index.toString()}
                                className="bg-gray-100 rounded-lg p-3 mb-3 shadow-sm"
                            >
                                <View className="flex flex-row items-center">
                                    <Text className="font-hsemibold text-black text-md">
                                        {item.owner.username}:{' '}
                                    </Text>
                                    <Text className="font-hregular text-black text-md">
                                        {item.text}
                                    </Text>
                                </View>
                                <Text
                                    className="font-hregular text-gray-600 text-xs mt-1"
                                    style={{ alignSelf: 'flex-start' }}
                                >
                                    {formatDistanceToNow(
                                        new Date(item.datetime),
                                        { addSuffix: true }
                                    )}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View className="flex flex-row items-center bg-white rounded-lg shadow-sm">
                        <TextInput
                            className="flex-1 border border-gray-200 rounded-lg p-2 bg-gray-200 mr-2"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChangeText={setNewComment}
                        />
                        <TouchableOpacity
                            onPress={handleAddComment}
                            className="bg-primarytint-200 py-2 px-4 rounded-lg"
                        >
                            <Text className="text-white">Post</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    )
}

export default CommunityPost
