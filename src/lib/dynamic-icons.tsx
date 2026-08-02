import {
  Users, BookOpen, GraduationCap, Award, Shield, Zap, BarChart3, Store, TrendingUp,
  UserCheck, Globe, Building, Building2, ShoppingBag, Star, Crown, Heart, Target,
  Rocket, Check, CheckCircle, Clock, Calendar, Phone, Mail, MapPin, Settings, Sparkles,
  MessageSquare, FileText, Briefcase, Video, DollarSign, Wallet, Lightbulb, Handshake,
  Layers, PenSquare, Eye, type LucideIcon,
} from 'lucide-react';

export const dynamicIconMap: Record<string, LucideIcon> = {
  Users, BookOpen, GraduationCap, Award, Shield, Zap, BarChart3, Store, TrendingUp,
  UserCheck, Globe, Building, Building2, ShoppingBag, Star, Crown, Heart, Target,
  Rocket, Check, CheckCircle, Clock, Calendar, Phone, Mail, MapPin, Settings, Sparkles,
  MessageSquare, FileText, Briefcase, Video, DollarSign, Wallet, Lightbulb, Handshake,
  Layers, PenSquare, Eye,
};

export function getDynamicIcon(name?: string): LucideIcon {
  return (name && dynamicIconMap[name]) || Sparkles;
}
