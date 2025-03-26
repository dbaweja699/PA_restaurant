
{ pkgs }: {
    deps = [
      pkgs.postgresql
        pkgs.nodejs-20_x
        pkgs.nodePackages.typescript
    ];
}
