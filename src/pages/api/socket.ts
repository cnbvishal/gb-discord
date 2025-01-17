import { NextApiRequest, NextApiResponse } from 'next';
import { Socket } from 'socket.io';
import CustomSocketServer from '@/types/extended/custom-socket-server';

import { MessageType } from '@/types';
import connectSheet from '../../../utils/connectSheet';
import { getSheetInstance } from '../../../utils/sheet-helpers';

export default function SocketHandler(
  _req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  // Socket don't have {.server} property
  const socketUntyped = res.socket as any;

  if (socketUntyped.server.io) {
    res.end();
    return;
  }

  const io = new CustomSocketServer(socketUntyped.server, {
    path: '/api/socket',
    addTrailingSlash: false,
  });

  // Assign {io} instance
  // ... and check in next call
  socketUntyped.server.io = io;

  io.on('connection', (socket: Socket) => {
    socket.on('send-message', async (msg: MessageType) => {
      const doc = await connectSheet();
      const sheet = getSheetInstance({ doc, method: 'sheetsByTitle', key: 'chat' });

      sheet.addRow({
        timestamp: new Date(),
        user_id: msg.userId,
        message: msg.message,
        user_name: msg.userName,
        message_id: msg.messageId,
      });

      console.log(`message: ${JSON.stringify(msg)}`);
      socket.broadcast.emit('receive-message', msg);
    });
  });

  console.log('Setting up socket ...');
  res.end();
}
