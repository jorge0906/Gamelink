import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(){
   return{
     status: false,
     message: 'API en /api/v1/gamelink',
   }
  }
}
