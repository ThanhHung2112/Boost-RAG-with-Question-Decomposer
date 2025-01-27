import { HyperlinkModel } from "../models";

import { BaseRepository } from "./base.repository";

class HyperlinkRepository extends BaseRepository<HyperlinkModel> {
  constructor() {
    super(HyperlinkModel);
  }
}

export const hyperlinkRepository = new HyperlinkRepository();
