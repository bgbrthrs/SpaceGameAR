import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [score, setScore] = useState(0);
  const [targetPos, setTargetPos] = useState({ top: height / 2, left: width / 2 });
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState('START');
  
  // Ses objesini referans olarak tutalım ki her seferinde baştan yüklemesin
  const soundObject = useRef(new Audio.Sound());

  // 1. ADIM: Ses ayarları ve Sesi önceden yükleme
  useEffect(() => {
    async function prepareAudio() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });
        // Sesi internetten çek ve hazırda beklet (Download yapmıyoruz, stream ediyoruz)
        await soundObject.current.loadAsync(
          { uri: 'https://www.soundjay.com/buttons/sounds/button-30.mp3' }
        );
      } catch (error) {
        console.log("Ses yükleme hatası:", error);
      }
    }
    prepareAudio();

    // Uygulama kapandığında belleği temizle
    return () => {
      soundObject.current.unloadAsync();
    };
  }, []);

  // 2. ADIM: Hazırdaki sesi tetikle
  async function playLaserSound() {
    try {
      await soundObject.current.replayAsync(); // Sesi en baştan tekrar çal
    } catch (error) {
      console.log("Ses çalma hatası:", error);
    }
  }

  const moveTarget = () => {
    const newTop = Math.random() * (height - 300) + 150;
    const newLeft = Math.random() * (width - 100) + 20;
    setTargetPos({ top: newTop, left: newLeft });
  };

  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameState('END');
    }
  }, [timeLeft, gameState]);

  const handleShoot = () => {
    if (gameState !== 'PLAYING') return;
    playLaserSound(); // Artık gecikmesiz çalışacak
    setScore(score + 100);
    moveTarget();
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={requestPermission} style={styles.mainButton}>
          <Text style={styles.mainButtonText}>KAMERAYI AÇ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <View style={styles.header}>
            <View style={styles.statBox}><Text style={styles.statsText}>SKOR: {score}</Text></View>
            <View style={styles.statBox}><Text style={[styles.statsText, {color: timeLeft < 10 ? 'red' : '#00FF00'}]}>SÜRE: {timeLeft}</Text></View>
          </View>

          {gameState === 'START' && (
            <TouchableOpacity style={styles.mainButton} onPress={() => setGameState('PLAYING')}>
              <Text style={styles.mainButtonText}>AV BAŞLASIN</Text>
            </TouchableOpacity>
          )}

          {gameState === 'PLAYING' && (
            <TouchableOpacity 
              style={[styles.target, { top: targetPos.top, left: targetPos.left }]} 
              onPress={handleShoot}
            >
              <View style={styles.outerRing}><View style={styles.innerRing} /></View>
            </TouchableOpacity>
          )}

          {gameState === 'END' && (
            <View style={styles.endScreen}>
              <Text style={styles.gameOverText}>ZAMAN DOLDU</Text>
              <Text style={styles.finalScore}>SKOR: {score}</Text>
              <TouchableOpacity style={styles.mainButton} onPress={() => {setScore(0); setTimeLeft(30); setGameState('PLAYING');}}>
                <Text style={styles.mainButtonText}>YENİDEN DENE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60 },
  statBox: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#00FF00' },
  statsText: { color: '#00FF00', fontSize: 20, fontWeight: 'bold' },
  target: { position: 'absolute', width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  outerRing: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: 'red', justifyContent: 'center', alignItems: 'center' },
  innerRing: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'red' },
  mainButton: { backgroundColor: '#00FF00', padding: 20, borderRadius: 30, alignSelf: 'center', marginTop: height / 2.5 },
  mainButtonText: { color: 'black', fontSize: 24, fontWeight: 'bold' },
  endScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)' },
  gameOverText: { color: 'red', fontSize: 36, fontWeight: 'bold' },
  finalScore: { color: 'white', fontSize: 28, marginVertical: 20 }
});