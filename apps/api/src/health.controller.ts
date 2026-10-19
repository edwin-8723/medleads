import { Controller, Get } from '@nestjs/common';

/** Ruta pública y liviana para monitoreo (UptimeRobot) y para evitar que Render duerma el servicio. */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
