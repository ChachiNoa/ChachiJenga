import i18n from '../i18n';

const errorMap = {
  es: {
    'User is already in a guild': 'El usuario ya pertenece a un gremio',
    'You are already in a guild': 'Ya perteneces a un gremio',
    'Guild not found': 'Gremio no encontrado',
    'Guild name already exists': 'El nombre del gremio ya está en uso',
    'Guild is full (Max 15)': 'El gremio está lleno (Máx 15)',
    'User not found': 'Usuario no encontrado',
    'You cannot invite yourself': 'No puedes invitarte a ti mismo',
    'You are not in this guild': 'No perteneces a este gremio',
    'Only admins or owner can invite to a private guild': 'Solo los administradores o el propietario pueden invitar a un gremio privado',
    'User already has a pending invitation to this guild': 'El usuario ya tiene una invitación pendiente para este gremio',
    'Invitation not found or no longer valid': 'Invitación no encontrada o caducada',
    'Invitation not found': 'Invitación no encontrada',
    'This guild is private. You must be friends with the owner.': 'Este gremio es privado. Debes ser amigo del propietario.',
    'Owner cannot leave the guild. Transfer ownership or delete it.': 'El propietario no puede abandonar el gremio. Transfiere la propiedad o elimínalo.',
    'Only the owner can delete the guild': 'Solo el propietario puede eliminar el gremio',
    'Only the owner or admins can edit the guild': 'Solo el propietario o los administradores pueden editar el gremio',
    'Cannot kick yourself': 'No puedes expulsarte a ti mismo',
    'Only owner or admins can kick members': 'Solo el propietario o administradores pueden expulsar miembros',
    'User is not in this guild': 'El usuario no está en este gremio',
    'Admins cannot kick other admins': 'Los administradores no pueden expulsar a otros administradores',
    'Only the owner can manage admins': 'Solo el propietario puede gestionar los administradores',
    'Only the owner can transfer ownership': 'Solo el propietario puede transferir la propiedad',
    'User is not a member': 'El usuario no es miembro',
    'You cannot send a friend request to yourself': 'No puedes enviarte una solicitud de amistad a ti mismo',
    'Already friends': 'Ya sois amigos',
    'Friend request already sent': 'La solicitud de amistad ya fue enviada',
    'Friend request not found': 'Solicitud de amistad no encontrada',
    'You cannot reject a request you sent': 'No puedes rechazar una solicitud que enviaste',
    'Friendship not found': 'Amistad no encontrada',
  }
};

const successMap = {
  es: {
    'Invitation sent': 'Invitación enviada',
    'Friend request sent': 'Solicitud de amistad enviada',
    'Profile updated': 'Perfil actualizado',
  }
}

export function getErrorMessage(error) {
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en';
  if (lang === 'es' && errorMap.es[error]) {
    return errorMap.es[error];
  }
  return error;
}

export function getSuccessMessage(msg) {
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en';
  if (lang === 'es' && successMap.es[msg]) {
    return successMap.es[msg];
  }
  return msg;
}
