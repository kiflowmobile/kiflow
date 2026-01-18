import React from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/shared/ui';
import { MessageCircle } from 'lucide-react-native';

interface MessageBubbleProps {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, text, id }) => (
  <View
    key={id}
    className={`py-2.5 px-3.5 rounded-xl mb-3 ${
      role === 'ai' ? 'bg-black/5 self-start flex-row items-center' : 'bg-black/3 self-end'
    }`}
  >
    {role === 'ai' && <Icon as={MessageCircle} size={20} color="#0f172a" className="mr-1.5" />}
    <Text className="text-base text-slate-900 leading-[22px]">{text}</Text>
  </View>
);
