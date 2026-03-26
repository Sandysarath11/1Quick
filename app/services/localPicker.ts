import * as DocumentPicker from 'expo-document-picker';

export const pickLocalSong = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
  });

  if (result.assets?.length) {
    const file = result.assets[0];

    return {
      id: file.uri,
      title: file.name,
      artist: 'Local File',
      uri: file.uri,
      isLocal: true,
    };
  }

  return null;
};