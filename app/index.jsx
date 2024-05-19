import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, View, Image } from 'react-native';
import { Redirect, router, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../constants';
import CustomButton from '../components/CustomButton';

export default function App() {
  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ height: '100%' }}>
        <View className="w-full justify-center items-center min-h-[85vh] px-4">
          <Image
            source={ images.dollaz }
            className="w-[390px] h-[252px]"
            resizeMode="contain"
          />

          <Text className="text-secondary font-pblack text-7xl mt-8">
            Dollaz
          </Text>

          <View className="relative mt-7">
            <Image
                source={ images.zigzag }
                className="w-[496px] h-[110px] absolute -bottom-7 -right-70.5"
                resizeMode="contain"
            />

            <Text className="text-3xl text-white font-bold text-center font-pmedium">
              Trade. Social. Earn.
            </Text>
          </View>

          <CustomButton
            title="Continue with email"
            handlePress={() => router.push('/sign-in')}
            containerStyles="w-full mt-12"
          />
        </View>
      </ScrollView>

      {/* Light / Dark mode of status bar */}
      <StatusBar backgroundColor='#161622' style='light'/>

    </SafeAreaView>
  );
}

    // <View className="flex-1 items-center justify-center bg-white">
    //   <Text className="text-3xl font-pblack">DollaZ</Text>
    //   <StatusBar style="auto" />
    //   <Link href="/home" style= {{ color: 'blue' }}>
    //     Go to Home</Link>
    // </View>
